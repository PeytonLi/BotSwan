import type {
  AgentStep,
  AuditCost,
  AuditPlan,
  ChartExtraction,
  PipelineStep,
  Violation,
  ViolationSeverity,
} from "@botswan/shared";
import { PIPELINE_STEPS } from "@botswan/shared";
import { computeGrade } from "@botswan/artifacts";
import { CostTracker } from "./cost-tracker";
import type { CompletionResult, OpenRouterClient } from "./openrouter";
import { buildComputeMessages } from "./prompts/compute";
import { buildExtractMessages } from "./prompts/extract";
import { buildPlanMessages } from "./prompts/plan";
import {
  buildVerifyMessages,
  type VerifyResult,
} from "./prompts/verify";
import {
  executeStatsCode,
  renderStatsChart,
  type StatsRenderSpec,
} from "./stats-client";

export type LlmClient = Pick<OpenRouterClient, "createCompletion">;

export interface ExtractPlanResult {
  extraction: ChartExtraction;
  plan: AuditPlan;
  steps: AgentStep[];
  cost: AuditCost;
}

export interface ComputeStepResult {
  code: string;
  stdout: string;
  error: string | null;
}

export interface FullAuditPipelineResult extends ExtractPlanResult {
  compute: ComputeStepResult;
  verifyResult: VerifyResult;
  renderPng: Uint8Array;
  violations: Violation[];
  grade: string;
  trustScore: number;
}

export interface FullAuditPipelineOptions extends ExtractPlanPipelineOptions {
  visionLlm?: LlmClient;
  fetchFn?: typeof fetch;
}

export interface ExtractPlanPipelineOptions {
  imageDataUrl: string;
  llm: LlmClient;
  onStep?: (step: AgentStep) => void;
  estimateCostUsd?: (usage: CompletionResult["usage"]) => number;
}

export class PipelineError extends Error {
  constructor(
    message: string,
    readonly steps: AgentStep[],
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

function now(): number {
  return Date.now();
}

function emitStep(onStep: ExtractPlanPipelineOptions["onStep"], step: AgentStep) {
  onStep?.(step);
}

function runningStep(step: PipelineStep, summary: string): AgentStep {
  return { step, status: "running", summary, timestamp: now() };
}

function doneStep(
  step: PipelineStep,
  summary: string,
  tokensUsed?: number,
): AgentStep {
  return { step, status: "done", summary, timestamp: now(), tokensUsed };
}

function errorStep(step: PipelineStep, summary: string): AgentStep {
  return { step, status: "error", summary, timestamp: now() };
}

function parseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Failed to parse ${label} JSON: ${raw.slice(0, 120)}`);
  }
}

function defaultEstimateCostUsd(usage: CompletionResult["usage"]): number {
  const inputRate = 0.000_000_5;
  const outputRate = 0.000_001_5;
  return usage.inputTokens * inputRate + usage.outputTokens * outputRate;
}

async function runStep<T>(
  step: PipelineStep,
  summary: string,
  run: () => Promise<{ result: T; completion: CompletionResult }>,
  steps: AgentStep[],
  onStep: ExtractPlanPipelineOptions["onStep"],
  costTracker: CostTracker,
  estimateCostUsd: (usage: CompletionResult["usage"]) => number,
): Promise<T> {
  const running = runningStep(step, summary);
  steps.push(running);
  emitStep(onStep, running);

  try {
    const { result, completion } = await run();
    costTracker.addUsage({
      ...completion.usage,
      usd: estimateCostUsd(completion.usage),
    });
    const tokensUsed =
      completion.usage.inputTokens + completion.usage.outputTokens;
    const finished = doneStep(step, `${summary} — complete`, tokensUsed);
    steps[steps.length - 1] = finished;
    emitStep(onStep, finished);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = errorStep(step, message);
    steps[steps.length - 1] = failed;
    emitStep(onStep, failed);
    throw new PipelineError(message, [...steps]);
  }
}

export async function runExtractPlanPipeline(
  options: ExtractPlanPipelineOptions,
): Promise<ExtractPlanResult> {
  const steps: AgentStep[] = [];
  const costTracker = new CostTracker();
  const estimateCostUsd =
    options.estimateCostUsd ?? defaultEstimateCostUsd;

  const extraction = await runStep(
    "EXTRACT",
    "Extracting chart metadata and claims",
    async () => {
      const completion = await options.llm.createCompletion({
        messages: buildExtractMessages(options.imageDataUrl),
      });
      return {
        result: parseJson<ChartExtraction>(completion.content, "EXTRACT"),
        completion,
      };
    },
    steps,
    options.onStep,
    costTracker,
    estimateCostUsd,
  );

  const plan = await runStep(
    "PLAN",
    "Planning statistical checks",
    async () => {
      const completion = await options.llm.createCompletion({
        messages: buildPlanMessages(extraction),
      });
      return {
        result: parseJson<AuditPlan>(completion.content, "PLAN"),
        completion,
      };
    },
    steps,
    options.onStep,
    costTracker,
    estimateCostUsd,
  );

  return {
    extraction,
    plan,
    steps,
    cost: costTracker.getTotals(),
  };
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:python)?\s*([\s\S]*?)```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function parseCheckResults(stdout: string): Map<string, boolean> {
  const results = new Map<string, boolean>();
  for (const line of stdout.split(/\r?\n/)) {
    const match = line.match(/^CHECK:([a-z0-9_]+):(PASS|FAIL)$/i);
    if (match) {
      results.set(match[1], match[2].toUpperCase() === "PASS");
    }
  }
  return results;
}

function severityForCheck(checkId: string): ViolationSeverity {
  if (checkId.includes("critical") || checkId.includes("cherry")) {
    return "critical";
  }
  if (checkId.includes("axis") || checkId.includes("truncat")) {
    return "major";
  }
  return "minor";
}

function violationsFromCompute(
  plan: AuditPlan,
  stdout: string,
  verifyResult: VerifyResult,
): Violation[] {
  const checkResults = parseCheckResults(stdout);
  const violations: Violation[] = [];

  for (const check of plan.checks) {
    const passed = checkResults.get(check.id);
    if (passed === false) {
      violations.push({
        code: check.id,
        severity: severityForCheck(check.id),
        title: check.name,
        explanation: check.rationale,
      });
    }
  }

  if (!verifyResult.passed) {
    violations.push({
      code: "visual_deception",
      severity: "major",
      title: "Visual deception confirmed",
      explanation: verifyResult.summary,
    });
  }

  return violations;
}

function buildRenderSpec(extraction: ChartExtraction): StatsRenderSpec {
  const years = extraction.timeRange?.match(/\d{4}/g) ?? ["2020", "2024"];
  const start = Number(years[0] ?? 2020);
  const end = Number(years[years.length - 1] ?? start + 4);
  const x: number[] = [];
  const y: number[] = [];
  for (let year = start; year <= end; year += 1) {
    x.push(year);
    y.push(95 + (year - start) * 2.5);
  }

  return {
    chart_type: extraction.chartType.toLowerCase().includes("bar") ? "bar" : "line",
    x,
    y,
    title: `Honest re-chart: ${extraction.yAxis ?? "values"}`,
  };
}

function pngToDataUrl(png: Uint8Array): string {
  const base64 = Buffer.from(png).toString("base64");
  return `data:image/png;base64,${base64}`;
}

async function runNonLlmStep<T>(
  step: PipelineStep,
  summary: string,
  run: () => Promise<T>,
  steps: AgentStep[],
  onStep: ExtractPlanPipelineOptions["onStep"],
): Promise<T> {
  const running = runningStep(step, summary);
  steps.push(running);
  emitStep(onStep, running);

  try {
    const result = await run();
    const finished = doneStep(step, `${summary} — complete`);
    steps[steps.length - 1] = finished;
    emitStep(onStep, finished);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = errorStep(step, message);
    steps[steps.length - 1] = failed;
    emitStep(onStep, failed);
    throw new PipelineError(message, [...steps]);
  }
}

export async function runFullAuditPipeline(
  options: FullAuditPipelineOptions,
): Promise<FullAuditPipelineResult> {
  const fetchFn = options.fetchFn ?? fetch;
  const base = await runExtractPlanPipeline(options);
  const steps = [...base.steps];
  const costTracker = new CostTracker();
  costTracker.addUsage({
    inputTokens: base.cost.inputTokens,
    outputTokens: base.cost.outputTokens,
    reasoningTokens: base.cost.reasoningTokens,
    usd: base.cost.usd,
  });
  const estimateCostUsd =
    options.estimateCostUsd ?? defaultEstimateCostUsd;

  const code = await runStep(
    "COMPUTE",
    "Generating and executing Python statistical checks",
    async () => {
      const completion = await options.llm.createCompletion({
        messages: buildComputeMessages(base.extraction, base.plan),
      });
      const python = stripCodeFences(completion.content);
      const execResult = await executeStatsCode(python, fetchFn);
      return {
        result: {
          code: python,
          stdout: execResult.stdout,
          error: execResult.error,
        },
        completion,
      };
    },
    steps,
    options.onStep,
    costTracker,
    estimateCostUsd,
  );

  let renderPng: Uint8Array | undefined;

  const verifyResult = await runStep(
    "VERIFY",
    "Comparing original and honest chart images",
    async () => {
      if (!options.visionLlm) {
        return {
          result: {
            passed: true,
            summary: "Mock verification — no vision LLM configured",
          },
          completion: {
            content: "",
            usage: { inputTokens: 0, outputTokens: 0 },
          },
        };
      }

      if (!renderPng) {
        renderPng = await renderStatsChart(
          buildRenderSpec(base.extraction),
          fetchFn,
        );
      }

      const honestDataUrl = pngToDataUrl(renderPng);
      const completion = await options.visionLlm.createCompletion({
        messages: buildVerifyMessages(options.imageDataUrl, honestDataUrl),
      });
      return {
        result: parseJson<VerifyResult>(completion.content, "VERIFY"),
        completion,
      };
    },
    steps,
    options.onStep,
    costTracker,
    estimateCostUsd,
  );

  if (verifyResult.summary.includes("Mock verification")) {
    const verifyIndex = steps.findIndex((s) => s.step === "VERIFY");
    if (verifyIndex >= 0) {
      steps[verifyIndex] = doneStep("VERIFY", verifyResult.summary);
      emitStep(options.onStep, steps[verifyIndex]!);
    }
  }

  const finalRenderPng = await runNonLlmStep(
    "RENDER",
    "Rendering honest chart with corrected axes",
    async () => {
      if (!renderPng) {
        renderPng = await renderStatsChart(
          buildRenderSpec(base.extraction),
          fetchFn,
        );
      }
      return renderPng;
    },
    steps,
    options.onStep,
  );

  const violations = await runNonLlmStep(
    "PACKAGE",
    "Packaging violations and grade",
    async () => violationsFromCompute(base.plan, code.stdout, verifyResult),
    steps,
    options.onStep,
  );

  const { grade, trustScore } = computeGrade(violations);

  return {
    ...base,
    steps,
    cost: costTracker.getTotals(),
    compute: code,
    verifyResult,
    renderPng: finalRenderPng,
    violations,
    grade,
    trustScore,
  };
}

export function getNextPipelineStep(
  current: PipelineStep,
): PipelineStep | null {
  const index = PIPELINE_STEPS.indexOf(current);
  if (index === -1 || index >= PIPELINE_STEPS.length - 1) {
    return null;
  }
  return PIPELINE_STEPS[index + 1] ?? null;
}
