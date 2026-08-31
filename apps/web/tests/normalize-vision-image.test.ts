import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeVisionImageDataUrl } from "@/lib/normalize-vision-image";

vi.mock("@/lib/stats-client", () => ({
  rasterizeSvg: vi.fn(async () => Buffer.from("fake-png-bytes")),
}));

describe("normalizeVisionImageDataUrl", () => {
  const originalStatsUrl = process.env.STATS_API_URL;

  afterEach(() => {
    if (originalStatsUrl === undefined) {
      delete process.env.STATS_API_URL;
    } else {
      process.env.STATS_API_URL = originalStatsUrl;
    }
    vi.clearAllMocks();
  });

  it("converts SVG chart uploads to PNG via the stats service", async () => {
    process.env.STATS_API_URL = "http://stats.test";
    const svgPath = resolve(
      process.cwd(),
      "../../examples/charts/truncated-axis.svg",
    );
    const svg = readFileSync(svgPath, "utf8");
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

    const pngDataUrl = await normalizeVisionImageDataUrl(dataUrl);

    expect(pngDataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("passes through non-SVG images unchanged", async () => {
    const png = "data:image/png;base64,abc123";
    await expect(normalizeVisionImageDataUrl(png)).resolves.toBe(png);
  });
});
