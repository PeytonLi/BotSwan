import type { AuditInput } from "@botswan/shared";
import { api, getConvexClient } from "@/lib/convex-client";
import {
  buildArtifactUrls,
  createAuditSlug,
  finalizeMockAudit,
  isMockMode,
  runMockAuditPipeline,
  type AuditRunState,
} from "@/lib/audit-runner";
import {
  createOpenRouterClient,
  runFullAuditPipeline,
} from "@botswan/agent";

export interface AuditStartPayload {
  sessionId: string;
  input: AuditInput;
  imageDataUrl?: string;
}

export interface AuditStartResponse {
  slug: string;
  mode: "mock" | "live";
  streamUrl: string;
}

const inMemoryAudits = new Map<string, AuditRunState>();
const sessionAudits = new Map<string, string[]>();

export function getInMemoryAudit(slug: string): AuditRunState | undefined {
  return inMemoryAudits.get(slug);
}

export function listInMemoryAuditsBySession(sessionId: string): AuditRunState[] {
  const slugs = sessionAudits.get(sessionId) ?? [];
  return slugs
    .map((slug) => inMemoryAudits.get(slug))
    .filter((audit): audit is AuditRunState => audit !== undefined)
    .sort((a, b) => {
      const aTime = a.agentSteps[0]?.timestamp ?? 0;
      const bTime = b.agentSteps[0]?.timestamp ?? 0;
      return bTime - aTime;
    });
}

export async function startAudit(
  payload: AuditStartPayload,
): Promise<AuditStartResponse> {
  const slug = createAuditSlug();
  const mode = isMockMode() ? "mock" : "live";
  const streamUrl = `/api/audit/${slug}/stream`;

  const convex = getConvexClient();
  if (convex) {
    await convex.mutation(api.audits.createAudit, {
      slug,
      sessionId: payload.sessionId,
      input: payload.input,
    });
    await convex.mutation(api.audits.appendAgentStep, {
      slug,
      step: {
        step: "INTAKE",
        status: "running",
        summary: "Starting audit pipeline",
        timestamp: Date.now(),
      },
      status: "running",
    });
  }

  inMemoryAudits.set(slug, {
    slug,
    status: "running",
    agentSteps: [],
    cost: { inputTokens: 0, outputTokens: 0, reasoningTokens: 0, usd: 0 },
    violations: [],
    done: false,
  });

  const existing = sessionAudits.get(payload.sessionId) ?? [];
  sessionAudits.set(payload.sessionId, [slug, ...existing.filter((s) => s !== slug)]);

  void runAuditInBackground(slug, payload, mode);

  return { slug, mode, streamUrl };
}

async function runAuditInBackground(
  slug: string,
  payload: AuditStartPayload,
  mode: "mock" | "live",
): Promise<void> {
  const convex = getConvexClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  try {
    if (mode === "mock") {
      for await (const state of runMockAuditPipeline(slug, payload.input)) {
        inMemoryAudits.set(slug, state);
        if (convex) {
          const lastStep = state.agentSteps[state.agentSteps.length - 1];
          if (lastStep) {
            await convex.mutation(api.audits.appendAgentStep, {
              slug,
              step: lastStep,
              status: state.status,
            });
          }
          await convex.mutation(api.audits.updateCost, {
            slug,
            cost: state.cost,
          });
        }
      }

      const final = finalizeMockAudit(slug, baseUrl);
      const current = inMemoryAudits.get(slug);
      if (current) {
        inMemoryAudits.set(slug, {
          ...current,
          ...final,
          status: "complete",
          done: true,
        });
      }

      if (convex && current) {
        await convex.mutation(api.audits.completeAudit, {
          slug,
          grade: final.grade,
          trustScore: final.trustScore,
          violations: final.violations,
          artifacts: final.artifacts,
          cost: current.cost,
        });
      }
      return;
    }

    if (!payload.imageDataUrl) {
      throw new Error("imageDataUrl is required for live audits");
    }

    const llm = createOpenRouterClient({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    let latestCost = inMemoryAudits.get(slug)?.cost ?? {
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      usd: 0,
    };

    const pipelineResult = await runFullAuditPipeline({
      imageDataUrl: payload.imageDataUrl,
      llm,
      visionLlm: llm,
      onStep: async (agentStep) => {
        const state = inMemoryAudits.get(slug);
        if (!state) return;

        const agentSteps = [...state.agentSteps];
        const idx = agentSteps.findIndex((s) => s.step === agentStep.step);
        if (idx >= 0) agentSteps[idx] = agentStep;
        else agentSteps.push(agentStep);

        inMemoryAudits.set(slug, {
          ...state,
          agentSteps,
          cost: latestCost,
        });

        if (convex) {
          await convex.mutation(api.audits.appendAgentStep, {
            slug,
            step: agentStep,
            status: "running",
          });
        }
      },
    });

    latestCost = pipelineResult.cost;

    const artifacts = buildArtifactUrls(slug, process.env.NEXT_PUBLIC_SITE_URL);

    inMemoryAudits.set(slug, {
      slug,
      status: "complete",
      agentSteps: pipelineResult.steps,
      cost: pipelineResult.cost,
      violations: pipelineResult.violations,
      grade: pipelineResult.grade,
      trustScore: pipelineResult.trustScore,
      artifacts,
      done: true,
    });

    if (convex) {
      await convex.mutation(api.audits.completeAudit, {
        slug,
        grade: pipelineResult.grade,
        trustScore: pipelineResult.trustScore,
        violations: pipelineResult.violations,
        artifacts,
        cost: pipelineResult.cost,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed: AuditRunState = {
      slug,
      status: "failed",
      agentSteps: [
        {
          step: "PIPELINE",
          status: "error",
          summary: message,
          timestamp: Date.now(),
        },
      ],
      cost: inMemoryAudits.get(slug)?.cost ?? {
        inputTokens: 0,
        outputTokens: 0,
        usd: 0,
      },
      violations: [],
      done: true,
    };
    inMemoryAudits.set(slug, failed);

    if (convex) {
      await convex.mutation(api.audits.appendAgentStep, {
        slug,
        step: failed.agentSteps[0]!,
        status: "failed",
      });
    }
  }
}

export async function* streamAuditUpdates(
  slug: string,
): AsyncGenerator<AuditRunState> {
  let lastStepCount = -1;

  for (let i = 0; i < 120; i += 1) {
    const state = inMemoryAudits.get(slug);
    if (!state) {
      await delay(100);
      continue;
    }

    if (
      state.agentSteps.length !== lastStepCount ||
      state.done ||
      i === 0
    ) {
      lastStepCount = state.agentSteps.length;
      yield state;
    }

    if (state.done) return;
    await delay(250);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
