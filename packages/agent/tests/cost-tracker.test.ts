import { describe, expect, it } from "vitest";
import { CostTracker } from "../src/cost-tracker.js";

describe("CostTracker", () => {
  it("starts at zero tokens and usd", () => {
    const tracker = new CostTracker();
    expect(tracker.getTotals()).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      usd: 0,
    });
  });

  it("accumulates tokens and usd across multiple calls", () => {
    const tracker = new CostTracker();

    tracker.addUsage({
      inputTokens: 1200,
      outputTokens: 400,
      reasoningTokens: 200,
      usd: 0.002,
    });

    tracker.addUsage({
      inputTokens: 800,
      outputTokens: 300,
      usd: 0.0015,
    });

    expect(tracker.getTotals()).toEqual({
      inputTokens: 2000,
      outputTokens: 700,
      reasoningTokens: 200,
      usd: 0.0035,
    });
  });

  it("treats missing reasoning tokens as zero", () => {
    const tracker = new CostTracker();
    tracker.addUsage({ inputTokens: 100, outputTokens: 50, usd: 0.0001 });
    expect(tracker.getTotals().reasoningTokens).toBe(0);
  });

  it("resets accumulated usage", () => {
    const tracker = new CostTracker();
    tracker.addUsage({ inputTokens: 500, outputTokens: 100, usd: 0.001 });
    tracker.reset();
    expect(tracker.getTotals().inputTokens).toBe(0);
    expect(tracker.getTotals().usd).toBe(0);
  });
});
