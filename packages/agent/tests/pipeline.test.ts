import { describe, expect, it, vi } from "vitest";
import type { ChartExtraction, AuditPlan } from "@botswan/shared";
import { runExtractPlanPipeline } from "../src/pipeline.js";

const mockExtraction: ChartExtraction = {
  chartType: "line",
  xAxis: "Year",
  yAxis: "Revenue ($M)",
  timeRange: "2019–2024",
  claims: [
    { text: "Revenue grew 500% over the period", confidence: 0.85 },
    { text: "Steady upward trend with no downturns", confidence: 0.7 },
  ],
  notes: "Y-axis appears truncated, starting at 95 instead of 0",
};

const mockPlan: AuditPlan = {
  checks: [
    {
      id: "axis_truncation",
      name: "Axis truncation check",
      rationale: "Y-axis may not start at zero, exaggerating growth",
    },
    {
      id: "trend_test",
      name: "Trend significance test",
      rationale: "Verify claimed growth rate against extracted data",
    },
  ],
};

describe("pipeline EXTRACT → PLAN", () => {
  it("runs EXTRACT and PLAN steps with mocked LLM responses", async () => {
    const llm = {
      createCompletion: vi
        .fn()
        .mockResolvedValueOnce({
          content: JSON.stringify(mockExtraction),
          usage: { inputTokens: 1200, outputTokens: 350, reasoningTokens: 100 },
        })
        .mockResolvedValueOnce({
          content: JSON.stringify(mockPlan),
          usage: { inputTokens: 900, outputTokens: 200, reasoningTokens: 50 },
        }),
    };

    const onStep = vi.fn();

    const result = await runExtractPlanPipeline({
      imageDataUrl: "data:image/png;base64,fakechart",
      llm,
      onStep,
    });

    expect(llm.createCompletion).toHaveBeenCalledTimes(2);
    expect(result.extraction).toEqual(mockExtraction);
    expect(result.plan).toEqual(mockPlan);

    expect(result.steps.map((s) => s.step)).toEqual(["EXTRACT", "PLAN"]);
    expect(result.steps.every((s) => s.status === "done")).toBe(true);

    expect(onStep).toHaveBeenCalledTimes(4);
    expect(onStep.mock.calls[0][0].step).toBe("EXTRACT");
    expect(onStep.mock.calls[0][0].status).toBe("running");
    expect(onStep.mock.calls[1][0].status).toBe("done");
    expect(onStep.mock.calls[2][0].step).toBe("PLAN");
    expect(onStep.mock.calls[3][0].status).toBe("done");

    expect(result.cost.inputTokens).toBe(2100);
    expect(result.cost.outputTokens).toBe(550);
    expect(result.cost.reasoningTokens).toBe(150);
  });

  it("marks step as error when LLM returns invalid JSON", async () => {
    const onStep = vi.fn();
    const llm = {
      createCompletion: vi.fn().mockResolvedValue({
        content: "not valid json",
        usage: { inputTokens: 100, outputTokens: 20 },
      }),
    };

    await expect(
      runExtractPlanPipeline({
        imageDataUrl: "data:image/png;base64,bad",
        llm,
        onStep,
      }),
    ).rejects.toThrow("Failed to parse EXTRACT JSON");

    const extractEvents = onStep.mock.calls
      .map((call) => call[0] as { step: string; status: string })
      .filter((event) => event.step === "EXTRACT");

    expect(extractEvents.some((event) => event.status === "error")).toBe(true);
  });
});
