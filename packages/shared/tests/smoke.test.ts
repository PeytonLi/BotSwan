import { describe, expect, it } from "vitest";
import {
  GRADE_THRESHOLDS,
  MODEL,
  OPENROUTER_BASE,
  PIPELINE_STEPS,
} from "../src/index.js";

describe("@botswan/shared smoke", () => {
  it("exports model and OpenRouter base URL from PRD", () => {
    expect(MODEL).toBe("z-ai/glm-5.3-flash");
    expect(OPENROUTER_BASE).toBe("https://openrouter.ai/api/v1");
  });

  it("defines the full agent pipeline step order", () => {
    expect(PIPELINE_STEPS).toEqual([
      "INTAKE",
      "EXTRACT",
      "PLAN",
      "COMPUTE",
      "VERIFY",
      "RENDER",
      "PACKAGE",
    ]);
  });

  it("exports grade thresholds for report cards", () => {
    expect(GRADE_THRESHOLDS.A).toBe(90);
    expect(GRADE_THRESHOLDS.F).toBe(0);
  });
});
