import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  parseAuditRequest,
  resolveImageDataUrl,
} from "@/lib/parse-audit-request";

describe("parseAuditRequest", () => {
  it("parses JSON body with input type", async () => {
    const request = new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { type: "upload", hasGroundTruthCsv: false },
        imageDataUrl: "data:image/png;base64,abc",
      }),
    });

    const parsed = await parseAuditRequest(request);
    expect(parsed.input.type).toBe("upload");
    expect(parsed.imageDataUrl).toBe("data:image/png;base64,abc");
  });

  it("parses FormData upload with optional csv flag", async () => {
    const form = new FormData();
    form.set("inputType", "upload");
    form.set("image", new File(["png"], "chart.png", { type: "image/png" }));
    form.set("csv", new File(["a,b\n1,2"], "data.csv", { type: "text/csv" }));

    const request = new Request("http://localhost/api/audit", {
      method: "POST",
      body: form,
    });

    const parsed = await parseAuditRequest(request);
    expect(parsed.input.type).toBe("upload");
    expect(parsed.input.hasGroundTruthCsv).toBe(true);
    expect(parsed.imageDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("parses FormData url input without image", async () => {
    const form = new FormData();
    form.set("inputType", "url");
    form.set("url", "https://example.com/chart");

    const request = new Request("http://localhost/api/audit", {
      method: "POST",
      body: form,
    });

    const parsed = await parseAuditRequest(request);
    expect(parsed.input.type).toBe("url");
    expect(parsed.input.originalUrl).toBe("https://example.com/chart");
    expect(parsed.imageDataUrl).toBeUndefined();
  });

  it("parses FormData paste with imageDataUrl field", async () => {
    const form = new FormData();
    form.set("inputType", "paste");
    form.set("imageDataUrl", "data:image/png;base64,paste");

    const request = new Request("http://localhost/api/audit", {
      method: "POST",
      body: form,
    });

    const parsed = await parseAuditRequest(request);
    expect(parsed.input.type).toBe("paste");
    expect(parsed.imageDataUrl).toBe("data:image/png;base64,paste");
  });
});

describe("resolveImageDataUrl", () => {
  const originalStatsUrl = process.env.STATS_API_URL;
  const originalFetch = globalThis.fetch;

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

  it("returns existing imageDataUrl unchanged", async () => {
    const result = await resolveImageDataUrl({
      input: { type: "upload", hasGroundTruthCsv: false },
      imageDataUrl: "data:image/png;base64,abc",
    });
    expect(result).toBe("data:image/png;base64,abc");
  });

  it("errors gracefully when url input lacks STATS_API_URL", async () => {
    delete process.env.STATS_API_URL;
    await expect(
      resolveImageDataUrl({
        input: {
          type: "url",
          originalUrl: "https://example.com",
          hasGroundTruthCsv: false,
        },
      }),
    ).rejects.toThrow(/STATS_API_URL/);
  });

  it("screenshots url via stats service", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ png_base64: Buffer.from("png").toString("base64") }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as typeof fetch;

    const result = await resolveImageDataUrl({
      input: {
        type: "url",
        originalUrl: "https://example.com/chart",
        hasGroundTruthCsv: false,
      },
    });

    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://stats.test/screenshot-url",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("extracts first PDF page via stats service", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          pages: [{ page: 1, png_base64: Buffer.from("page1").toString("base64") }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as typeof fetch;

    const result = await resolveImageDataUrl({
      input: { type: "pdf", hasGroundTruthCsv: false },
      imageDataUrl: `data:application/pdf;base64,${Buffer.from("%PDF").toString("base64")}`,
    });

    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://stats.test/extract-pdf",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
