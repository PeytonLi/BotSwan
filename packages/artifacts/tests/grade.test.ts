import { describe, expect, it } from "vitest";
import type { Violation } from "@botswan/shared";
import { computeGrade } from "../src/grade.js";

describe("computeGrade", () => {
  it("returns F for critical violations", () => {
    const violations: Violation[] = [
      {
        code: "axis_truncation",
        severity: "critical",
        title: "Y-axis does not start at zero",
        explanation: "Truncated axis exaggerates growth.",
      },
    ];

    const result = computeGrade(violations);

    expect(result.grade).toBe("F");
    expect(result.trustScore).toBeLessThan(70);
  });

  it("returns A with no violations", () => {
    const result = computeGrade([]);

    expect(result.grade).toBe("A");
    expect(result.trustScore).toBe(100);
  });

  it("lowers trust score for major and minor violations", () => {
    const violations: Violation[] = [
      {
        code: "missing_source",
        severity: "major",
        title: "No data source cited",
        explanation: "Chart lacks attribution.",
      },
      {
        code: "rounding",
        severity: "minor",
        title: "Rounded percentages",
        explanation: "Values rounded without disclosure.",
      },
    ];

    const result = computeGrade(violations);

    expect(result.trustScore).toBeLessThan(100);
    expect(result.trustScore).toBeGreaterThan(60);
  });
});
