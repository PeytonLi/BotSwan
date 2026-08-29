import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  generateAuditMarkdown,
  generateNotebook,
  generateReportCardSvg,
  computeGrade,
} from "@botswan/artifacts";
import { getFrozenAudit } from "@/lib/frozen-audits";
import { getInMemoryAudit } from "@/lib/audit-service";
import { renderStatsChart } from "@/lib/stats-client";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ slug: string; file: string }>;
}

const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function frozenExtraction(slug: string) {
  const audit = getFrozenAudit(slug);
  return {
    chartType: "line",
    xAxis: "Year",
    yAxis: "Value",
    timeRange: "2019–2024",
    claims: [{ text: audit?.description ?? "Example chart claim" }],
    notes: audit?.description,
  };
}

function frozenPlan() {
  return {
    checks: [
      {
        id: "example_check",
        name: "Example statistical check",
        rationale: "Frozen audit demonstration check",
      },
    ],
  };
}

async function readChartSvg(slug: string): Promise<string | null> {
  const audit = getFrozenAudit(slug);
  if (!audit) return null;
  const chartPath = path.join(
    process.cwd(),
    "..",
    "..",
    "examples",
    "charts",
    audit.chartFile,
  );
  try {
    return await readFile(chartPath, "utf8");
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug, file } = await params;
  const frozen = getFrozenAudit(slug);
  const memory = getInMemoryAudit(slug);
  const violations = frozen?.violations ?? memory?.violations;
  const title = frozen?.title ?? `Audit ${slug}`;

  if (!violations || violations.length === 0) {
    if (!frozen && !memory) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }
  }

  const auditViolations = violations ?? [];
  const { grade, trustScore } = computeGrade(auditViolations);

  switch (file) {
    case "report-card.svg": {
      const svg = generateReportCardSvg(auditViolations, grade, trustScore);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    case "audit.md": {
      const markdown = generateAuditMarkdown(
        frozenExtraction(slug),
        frozenPlan(),
        auditViolations,
        { results: [] },
      );
      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    case "audit.ipynb": {
      const notebook = generateNotebook([
        {
          code: "# BotSwan frozen example audit\nprint('Reproducible checks for demo')",
          output: "Reproducible checks for demo\n",
        },
      ]);
      return new NextResponse(notebook, {
        headers: {
          "Content-Type": "application/x-ipynb+json",
          "Content-Disposition": `attachment; filename="audit-${slug}.ipynb"`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    case "honest-chart.png": {
      try {
        const png = await renderStatsChart({
          chart_type: "line",
          x: [2019, 2020, 2021, 2022, 2023, 2024],
          y: [40, 55, 62, 70, 78, 88],
          title: `Honest chart: ${title}`,
        });
        return new NextResponse(Buffer.from(png), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600",
          },
        });
      } catch {
        return new NextResponse(PLACEHOLDER_PNG, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=300",
          },
        });
      }
    }

    case "original.svg": {
      const svg = frozen ? await readChartSvg(slug) : null;
      if (!svg) {
        return NextResponse.json({ error: "Chart not found" }, { status: 404 });
      }
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    default:
      return NextResponse.json({ error: "Unknown artifact" }, { status: 404 });
  }
}
