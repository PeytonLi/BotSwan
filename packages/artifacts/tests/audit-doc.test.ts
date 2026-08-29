import { describe, expect, it } from "vitest";
import type {
  AuditPlan,
  ChartExtraction,
  Violation,
} from "@botswan/shared";
import { generateAuditMarkdown } from "../src/audit-doc.js";
import type { ComputeResults } from "../src/audit-doc.js";

const extraction: ChartExtraction = {
  chartType: "bar",
  xAxis: "Category",
  yAxis: "Sales",
  claims: [{ text: "Sales doubled in Q4" }],
};

const plan: AuditPlan = {
  checks: [
    {
      id: "baseline",
      name: "Baseline comparison",
      rationale: "Compare Q4 to Q3",
    },
  ],
};

const violations: Violation[] = [
  {
    code: "cherry_pick",
    severity: "major",
    title: "Cherry-picked time range",
    explanation: "Only favorable months shown.",
  },
];

const computeResults: ComputeResults = {
  results: [
    {
      checkId: "baseline",
      passed: false,
      output: "Growth was 12%, not 100%",
      code: "print(0.12)",
    },
  ],
};

describe("generateAuditMarkdown", () => {
  it("includes violation titles", () => {
    const markdown = generateAuditMarkdown(
      extraction,
      plan,
      violations,
      computeResults,
    );

    expect(markdown).toContain("Cherry-picked time range");
    expect(markdown).toContain("# BotSwan Audit Report");
    expect(markdown).toContain("Baseline comparison");
  });
});
