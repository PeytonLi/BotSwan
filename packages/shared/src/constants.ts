import type { PipelineStep } from "./types";

export const MODEL = "z-ai/glm-5.3-flash";

export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export const DEFAULT_LLM_PARAMS = {
  temperature: 1,
  top_p: 0.95,
} as const;

export const PIPELINE_STEPS: readonly PipelineStep[] = [
  "INTAKE",
  "EXTRACT",
  "PLAN",
  "COMPUTE",
  "VERIFY",
  "RENDER",
  "PACKAGE",
] as const;

export const GRADE_THRESHOLDS = {
  A: 90,
  B: 80,
  C: 70,
  D: 60,
  F: 0,
} as const;

export const MAX_RETRIES_PER_STEP = 2;

export const SANDBOX_TIMEOUT_SECONDS = 30;

export const SANDBOX_MAX_TIMEOUT_SECONDS = 120;
