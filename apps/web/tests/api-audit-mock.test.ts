import { describe, expect, it } from "vitest";
import {
  createAuditSlug,
  finalizeMockAudit,
  isMockMode,
  runMockAuditPipeline,
} from "@/lib/audit-runner";
import { computeGrade } from "@botswan/artifacts";

describe("audit mock pipeline", () => {
  it("detects mock mode without OPENROUTER_API_KEY", () => {
    const original = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    expect(isMockMode()).toBe(true);
    process.env.OPENROUTER_API_KEY = original;
  });

  it("creates url-safe slugs", () => {
    const slug = createAuditSlug();
    expect(slug).toMatch(/^[23456789abcdefghjkmnpqrstuvwxyz]{10}$/);
  });

  it("runs mock pipeline through all steps", async () => {
    const states = [];
    for await (const state of runMockAuditPipeline("testslug01", {
      type: "upload",
      hasGroundTruthCsv: false,
    })) {
      states.push(state);
    }

    const final = states[states.length - 1]!;
    expect(final.done).toBe(true);
    expect(final.status).toBe("complete");
    expect(final.agentSteps.length).toBeGreaterThanOrEqual(7);
    expect(final.violations.length).toBeGreaterThan(0);
    expect(final.cost.usd).toBeGreaterThan(0);
  });

  it("grades violations consistently", () => {
    const { grade, trustScore } = computeGrade(
      finalizeMockAudit("abc").violations,
    );
    expect(grade).toMatch(/^[A-F]$/);
    expect(trustScore).toBeGreaterThanOrEqual(0);
    expect(trustScore).toBeLessThanOrEqual(100);
  });
});
