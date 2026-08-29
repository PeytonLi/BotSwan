import type { ChartExtraction } from "@botswan/shared";

export interface HonestChartSpec {
  chart_type: string;
  x: (string | number)[];
  y: number[];
  title: string;
  xlabel?: string;
  ylabel?: string;
}

function normalizeChartType(chartType: string): string {
  const normalized = chartType.toLowerCase();
  if (normalized === "bar" || normalized === "scatter" || normalized === "line") {
    return normalized;
  }
  return "line";
}

function parseCsv(
  csvData: string,
  xAxis?: string,
  yAxis?: string,
): { x: string[]; y: number[]; xlabel?: string; ylabel?: string } {
  const lines = csvData.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return { x: [], y: [] };
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const xIndex = xAxis ? headers.indexOf(xAxis) : 0;
  const yIndex = yAxis ? headers.indexOf(yAxis) : 1;

  const xCol = xIndex >= 0 ? xIndex : 0;
  const yCol = yIndex >= 0 ? yIndex : 1;

  const x: string[] = [];
  const y: number[] = [];

  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim());
    if (cols.length <= Math.max(xCol, yCol)) continue;
    x.push(cols[xCol]);
    y.push(Number(cols[yCol]));
  }

  return {
    x,
    y,
    xlabel: headers[xCol],
    ylabel: headers[yCol],
  };
}

export function buildHonestChartSpec(
  extraction: ChartExtraction,
  csvData?: string,
): HonestChartSpec {
  const chart_type = normalizeChartType(extraction.chartType);
  const title = `Honest ${extraction.chartType} chart`;

  if (!csvData) {
    return { chart_type, x: [], y: [], title };
  }

  const parsed = parseCsv(csvData, extraction.xAxis, extraction.yAxis);

  return {
    chart_type,
    x: parsed.x,
    y: parsed.y,
    title,
    xlabel: parsed.xlabel ?? extraction.xAxis,
    ylabel: parsed.ylabel ?? extraction.yAxis,
  };
}
