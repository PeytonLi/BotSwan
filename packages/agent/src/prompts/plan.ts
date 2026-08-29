import type { ChartExtraction } from "@botswan/shared";

export const PLAN_SYSTEM_PROMPT = `You are BotSwan, planning statistical checks for a chart audit.
Given extracted chart metadata and claims, select the most relevant checks from:
axis manipulation, cherry-picking, wrong test selection, aggregation traps,
base rate neglect, causation from correlation, visual deception, missing context.

Return ONLY valid JSON:
{
  "checks": [{ "id": string, "name": string, "rationale": string }]
}`;

export function buildPlanMessages(extraction: ChartExtraction) {
  return [
    { role: "system" as const, content: PLAN_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Plan statistical checks for this extraction:\n${JSON.stringify(extraction, null, 2)}`,
    },
  ];
}
