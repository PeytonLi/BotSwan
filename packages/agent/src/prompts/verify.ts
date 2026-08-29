import { buildVisionMessage, type ChatMessage } from "../openrouter";

export interface VerifyResult {
  passed: boolean;
  summary: string;
}

export const VERIFY_SYSTEM_PROMPT = `You are BotSwan, comparing an original chart image with a re-rendered honest version.
Identify whether the honest chart fixes deceptive visual choices (truncated axes, cherry-picked ranges, etc.).

Return ONLY valid JSON:
{
  "passed": boolean,
  "summary": string
}`;

export function buildVerifyMessages(
  originalDataUrl: string,
  honestDataUrl: string,
): ChatMessage[] {
  return [
    { role: "system", content: VERIFY_SYSTEM_PROMPT },
    buildVisionMessage(
      "Original chart (possibly deceptive):",
      originalDataUrl,
    ),
    buildVisionMessage(
      "Honest re-render with corrected axes and full context:",
      honestDataUrl,
    ),
  ];
}
