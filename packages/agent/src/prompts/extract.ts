export const EXTRACT_SYSTEM_PROMPT = `You are BotSwan, an expert statistical auditor for data visualizations.
Analyze the provided chart image and extract structured metadata.

Return ONLY valid JSON matching this schema:
{
  "chartType": string,
  "xAxis": string | null,
  "yAxis": string | null,
  "timeRange": string | null,
  "claims": [{ "text": string, "confidence": number }],
  "notes": string | null
}

Focus on axis labels, implied trends, and statistical claims the chart suggests.`;

export const EXTRACT_USER_PROMPT =
  "Extract all statistical claims and chart metadata from this visualization.";

export function buildExtractMessages(imageDataUrl: string) {
  return [
    { role: "system" as const, content: EXTRACT_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: EXTRACT_USER_PROMPT },
        { type: "image_url" as const, image_url: { url: imageDataUrl } },
      ],
    },
  ];
}
