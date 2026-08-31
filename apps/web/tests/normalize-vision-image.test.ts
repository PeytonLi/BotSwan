import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeVisionImageDataUrl } from "@/lib/normalize-vision-image";

describe("normalizeVisionImageDataUrl", () => {
  it(
    "converts SVG chart uploads to PNG for vision models",
    () => {
      const svgPath = resolve(
        process.cwd(),
        "../../examples/charts/truncated-axis.svg",
      );
      const svg = readFileSync(svgPath, "utf8");
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

      const pngDataUrl = normalizeVisionImageDataUrl(dataUrl);

      expect(pngDataUrl.startsWith("data:image/png;base64,")).toBe(true);
      expect(pngDataUrl.length).toBeGreaterThan(dataUrl.length / 4);
    },
    15_000,
  );

  it("passes through non-SVG images unchanged", () => {
    const png = "data:image/png;base64,abc123";
    expect(normalizeVisionImageDataUrl(png)).toBe(png);
  });
});
