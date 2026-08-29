import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { ChartExtraction, AuditPlan } from "@botswan/shared";
import { runFullAuditPipeline } from "../src/pipeline.js";

const mockExtraction: ChartExtraction = {
  chartType: "line",
  xAxis: "Year",
  yAxis: "Revenue ($M)",
  timeRange: "2019–2024",
  claims: [
    { text: "Revenue grew 500% over the period", confidence: 0.85 },
  ],
  notes: "Y-axis appears truncated, starting at 95 instead of 0",
};

const mockPlan: AuditPlan = {
  checks: [
    {
      id: "axis_truncation",
      name: "Axis truncation check",
      rationale: "Y-axis may not start at zero",
    },
  ],
};

const mockPythonCode = `print("CHECK:axis_truncation:FAIL")
print("Y-axis baseline is 95, not 0")`;

const mockVerifyResult = {
  passed: false,
  summary: "Honest chart shows larger relative change was visual artifact",
};

describe("runFullAuditPipeline", () => {
  const originalFetch = globalThis.fetch;
  const originalStatsUrl = process.env.STATS_API_URL;

  beforeEach(() => {
    process.env.STATS_API_URL = "http://stats.test";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalStatsUrl === undefined) {
      delete process.env.STATS_API_URL;
    } else {
      process.env.STATS_API_URL = originalStatsUrl;
    }
  });

  it("runs EXTRACT through PACKAGE with mocked LLM and stats fetch", async () => {
    const llm = {
      createCompletion: vi
        .fn()
        .mockResolvedValueOnce({
          content: JSON.stringify(mockExtraction),
          usage: { inputTokens: 1000, outputTokens: 300 },
        })
        .mockResolvedValueOnce({
          content: JSON.stringify(mockPlan),
          usage: { inputTokens: 800, outputTokens: 200 },
        })
        .mockResolvedValueOnce({
          content: mockPythonCode,
          usage: { inputTokens: 600, outputTokens: 150 },
        })
        .mockResolvedValueOnce({
          content: JSON.stringify(mockVerifyResult),
          usage: { inputTokens: 900, outputTokens: 100 },
        }),
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/execute")) {
        return new Response(
          JSON.stringify({
            stdout: "CHECK:axis_truncation:FAIL\nY-axis baseline is 95, not 0",
            error: null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.endsWith("/render")) {
        return new Response(new Uint8Array([137, 80, 78, 71]), {
          status: 200,
          headers: { "Content-Type": "image/png" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    globalThis.fetch = fetchMock as typeof fetch;

    const onStep = vi.fn();

    const result = await runFullAuditPipeline({
      imageDataUrl: "data:image/png;base64,fakechart",
      llm,
      visionLlm: llm,
      onStep,
    });

    expect(result.extraction).toEqual(mockExtraction);
    expect(result.plan).toEqual(mockPlan);
    expect(result.steps.map((s) => s.step)).toEqual([
      "EXTRACT",
      "PLAN",
      "COMPUTE",
      "VERIFY",
      "RENDER",
      "PACKAGE",
    ]);
    expect(result.steps.every((s) => s.status === "done")).toBe(true);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]?.code).toBe("axis_truncation");
    expect(result.renderPng).toBeInstanceOf(Uint8Array);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://stats.test/execute",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://stats.test/render",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("mocks VERIFY when visionLlm is omitted", async () => {
    const llm = {
      createCompletion: vi
        .fn()
        .mockResolvedValueOnce({
          content: JSON.stringify(mockExtraction),
          usage: { inputTokens: 500, outputTokens: 100 },
        })
        .mockResolvedValueOnce({
          content: JSON.stringify(mockPlan),
          usage: { inputTokens: 400, outputTokens: 80 },
        })
        .mockResolvedValueOnce({
          content: 'print("CHECK:axis_truncation:PASS")',
          usage: { inputTokens: 300, outputTokens: 50 },
        }),
    };

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/execute")) {
        return new Response(
          JSON.stringify({ stdout: "CHECK:axis_truncation:PASS", error: null }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.endsWith("/render")) {
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "image/png" },
        });
      }
      return new Response("not found", { status: 404 });
    }) as typeof fetch;

    const result = await runFullAuditPipeline({
      imageDataUrl: "data:image/png;base64,fakechart",
      llm,
    });

    expect(llm.createCompletion).toHaveBeenCalledTimes(3);
    const verifyStep = result.steps.find((s) => s.step === "VERIFY");
    expect(verifyStep?.summary).toMatch(/mock/i);
    expect(result.verifyResult.passed).toBe(true);
  });
});
