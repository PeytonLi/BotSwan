import type {
  AgentStep,
  AuditArtifacts,
  AuditCost,
  AuditInput,
  AuditStatus,
  Violation,
} from "@botswan/shared";
import { PIPELINE_STEPS } from "@botswan/shared";
import {
  createOpenRouterClient,
  runExtractPlanPipeline,
} from "@botswan/agent";
import { computeGrade } from "@botswan/artifacts";

export interface StartAuditRequest {
  input: AuditInput;
  imageDataUrl?: string;
}

export interface StartAuditResult {
  slug: string;
  mode: "mock" | "live";
}

export interface AuditRunState {
  slug: string;
  status: AuditStatus;
  agentSteps: AgentStep[];
  cost: AuditCost;
  grade?: string;
  trustScore?: number;
  violations: Violation[];
  artifacts?: AuditArtifacts;
  done: boolean;
}

const MOCK_VIOLATIONS: Violation[] = [
  {
    code: "truncated_y_axis",
    severity: "major",
    title: "Truncated Y-axis",
    explanation:
      "The vertical axis starts at 95 instead of 0, exaggerating growth visually.",
  },
  {
    code: "missing_ci",
    severity: "minor",
    title: "No confidence intervals",
    explanation: "Point estimates are shown without uncertainty bands or sample sizes.",
  },
];

function now(): number {
  return Date.now();
}

function step(
  name: string,
  status: AgentStep["status"],
  summary: string,
  tokensUsed?: number,
): AgentStep {
  return { step: name, status, summary, timestamp: now(), tokensUsed };
}

export function buildArtifactUrls(
  slug: string,
  baseUrl?: string,
): AuditArtifacts {
  const base = (baseUrl ?? "").replace(/\/$/, "");
  const prefix = base ? `${base}/api/artifacts/${slug}` : `/api/artifacts/${slug}`;

  return {
    reportCardUrl: `${prefix}/report-card.svg`,
    auditPdfUrl: `${prefix}/audit.md`,
    notebookUrl: `${prefix}/audit.ipynb`,
    honestChartUrl: `${prefix}/honest-chart.png`,
    originalChartUrl: `${prefix}/original.svg`,
  };
}

export function createAuditSlug(): string {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  let slug = "";
  for (let i = 0; i < 10; i += 1) {
    slug += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return slug;
}

export function isMockMode(): boolean {
  return !process.env.OPENROUTER_API_KEY?.trim();
}

export async function* runMockAuditPipeline(
  slug: string,
  input: AuditInput,
): AsyncGenerator<AuditRunState> {
  const steps: AgentStep[] = [];
  let cost: AuditCost = {
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    usd: 0,
  };

  const summaries: Record<string, string> = {
    INTAKE: `Received ${input.type} input${input.hasGroundTruthCsv ? " with CSV ground truth" : ""}`,
    EXTRACT: "Detected line chart, 2019–2024, y-axis starts at 95 not 0",
    PLAN: "Running 4 checks: axis truncation, trend test, CI presence, sample size",
    COMPUTE: "Executed scipy trend test and axis baseline check in sandbox",
    VERIFY: "Compared honest re-chart against original — axis fix confirmed",
    RENDER: "Rendered honest chart with zero baseline and full time range",
    PACKAGE: "Packaged report card, PDF audit, notebook, and share link",
  };

  for (const pipelineStep of PIPELINE_STEPS) {
    const running = step(pipelineStep, "running", summaries[pipelineStep] ?? pipelineStep);
    steps.push(running);
    cost = {
      inputTokens: cost.inputTokens + 420,
      outputTokens: cost.outputTokens + 180,
      reasoningTokens: (cost.reasoningTokens ?? 0) + 90,
      usd: cost.usd + 0.0042,
    };

    yield {
      slug,
      status: "running",
      agentSteps: [...steps],
      cost: { ...cost },
      violations: [],
      done: false,
    };

    await delay(120);

    steps[steps.length - 1] = step(
      pipelineStep,
      "done",
      `${summaries[pipelineStep] ?? pipelineStep} — complete`,
      600,
    );

    yield {
      slug,
      status: pipelineStep === "PACKAGE" ? "complete" : "running",
      agentSteps: [...steps],
      cost: { ...cost },
      violations: pipelineStep === "PACKAGE" ? MOCK_VIOLATIONS : [],
      done: pipelineStep === "PACKAGE",
      ...(pipelineStep === "PACKAGE" ? computeGrade(MOCK_VIOLATIONS) : {}),
    };
  }
}

export async function runLiveExtractPlan(
  imageDataUrl: string,
  onStep?: (step: AgentStep) => void,
): Promise<{
  steps: AgentStep[];
  cost: AuditCost;
}> {
  const llm = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  const result = await runExtractPlanPipeline({
    imageDataUrl,
    llm,
    onStep,
  });

  return {
    steps: result.steps,
    cost: result.cost,
  };
}

export function finalizeMockAudit(slug: string, baseUrl?: string) {
  const { grade, trustScore } = computeGrade(MOCK_VIOLATIONS);
  return {
    grade,
    trustScore,
    violations: MOCK_VIOLATIONS,
    artifacts: buildArtifactUrls(slug, baseUrl),
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
