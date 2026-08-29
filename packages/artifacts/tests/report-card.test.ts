import { describe, expect, it } from "vitest";
import type { Violation } from "@botswan/shared";
import {
  generateReportCardHtml,
  generateReportCardSvg,
} from "../src/report-card.js";

const violations: Violation[] = [
  {
    code: "axis_truncation",
    severity: "critical",
    title: "Truncated Y-axis",
    explanation: "Axis starts at 95 instead of 0.",
  },
];

describe("generateReportCardHtml", () => {
  it("contains grade", () => {
    const html = generateReportCardHtml(violations, "F", 35);

    expect(html).toContain("F");
    expect(html).toContain("35");
    expect(html).toContain("Truncated Y-axis");
    expect(html).toContain("<!DOCTYPE html>");
  });
});

describe("generateReportCardSvg", () => {
  it("returns SVG with grade for OG image", () => {
    const svg = generateReportCardSvg(violations, "F", 35);

    expect(svg).toContain("<svg");
    expect(svg).toContain("F");
    expect(svg).toContain("35");
    expect(svg).toContain("Truncated Y-axis");
  });
});
