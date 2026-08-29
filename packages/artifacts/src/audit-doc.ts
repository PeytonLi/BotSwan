import type {
  AuditPlan,
  ChartExtraction,
  Violation,
} from "@botswan/shared";

export interface ComputeResult {
  checkId: string;
  passed: boolean;
  output: string;
  code?: string;
}

export interface ComputeResults {
  results: ComputeResult[];
}

export function generateAuditMarkdown(
  extraction: ChartExtraction,
  plan: AuditPlan,
  violations: Violation[],
  computeResults: ComputeResults,
): string {
  const lines: string[] = [
    "# BotSwan Audit Report",
    "",
    "## Chart Summary",
    "",
    `- **Type:** ${extraction.chartType}`,
  ];

  if (extraction.xAxis) lines.push(`- **X-axis:** ${extraction.xAxis}`);
  if (extraction.yAxis) lines.push(`- **Y-axis:** ${extraction.yAxis}`);
  if (extraction.timeRange) lines.push(`- **Time range:** ${extraction.timeRange}`);

  lines.push("", "## Extracted Claims", "");
  for (const claim of extraction.claims) {
    lines.push(`- ${claim.text}`);
  }

  if (extraction.notes) {
    lines.push("", "## Notes", "", extraction.notes);
  }

  lines.push("", "## Planned Checks", "");
  for (const check of plan.checks) {
    lines.push(`### ${check.name}`, "", check.rationale, "");
  }

  lines.push("## Compute Results", "");
  for (const result of computeResults.results) {
    const status = result.passed ? "PASS" : "FAIL";
    lines.push(
      `### ${result.checkId} — ${status}`,
      "",
      "```",
      result.output,
      "```",
    );
    if (result.code) {
      lines.push("", "```python", result.code, "```");
    }
    lines.push("");
  }

  lines.push("## Violations", "");
  if (violations.length === 0) {
    lines.push("No violations detected.");
  } else {
    for (const violation of violations) {
      lines.push(
        `### ${violation.title}`,
        "",
        `- **Severity:** ${violation.severity}`,
        `- **Code:** ${violation.code}`,
        "",
        violation.explanation,
        "",
      );
    }
  }

  return lines.join("\n");
}
