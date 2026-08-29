import { describe, expect, it } from "vitest";
import type { ChartExtraction } from "@botswan/shared";
import { buildHonestChartSpec } from "../src/honest-chart.js";

const extraction: ChartExtraction = {
  chartType: "line",
  xAxis: "year",
  yAxis: "revenue",
  claims: [{ text: "Steady growth" }],
};

describe("buildHonestChartSpec", () => {
  it("builds render spec from extraction metadata", () => {
    const spec = buildHonestChartSpec(extraction);

    expect(spec.chart_type).toBe("line");
    expect(spec.title).toContain("Honest");
    expect(spec.x).toEqual([]);
    expect(spec.y).toEqual([]);
  });

  it("parses CSV data into x/y series", () => {
    const csv = "year,revenue\n2020,10\n2021,20\n2022,30";
    const spec = buildHonestChartSpec(extraction, csv);

    expect(spec.x).toEqual(["2020", "2021", "2022"]);
    expect(spec.y).toEqual([10, 20, 30]);
    expect(spec.xlabel).toBe("year");
    expect(spec.ylabel).toBe("revenue");
  });

  it("maps bar chart types", () => {
    const spec = buildHonestChartSpec({ ...extraction, chartType: "bar" });

    expect(spec.chart_type).toBe("bar");
  });
});
