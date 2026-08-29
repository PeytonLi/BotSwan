import type { AuditPlan, ChartExtraction } from "@botswan/shared";

export const COMPUTE_SYSTEM_PROMPT = `You are BotSwan, generating Python code for statistical chart audit checks.
Use only stdlib plus numpy/scipy/pandas if needed. No file I/O or network calls.
For each planned check, print a line: CHECK:<check_id>:PASS or CHECK:<check_id>:FAIL
Then print human-readable evidence on following lines.

Return ONLY the Python source code, no markdown fences.`;

export function buildComputeMessages(
  extraction: ChartExtraction,
  plan: AuditPlan,
) {
  return [
    { role: "system" as const, content: COMPUTE_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Generate Python to run these checks:\n${JSON.stringify({ extraction, plan }, null, 2)}`,
    },
  ];
}
