import { rasterizeSvg } from "@/lib/stats-client";

function decodeSvgFromDataUrl(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) {
    throw new Error("Invalid SVG data URL");
  }

  const meta = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);

  if (meta.includes(";base64")) {
    return Uint8Array.from(Buffer.from(payload, "base64"));
  }

  return Uint8Array.from(Buffer.from(decodeURIComponent(payload), "utf8"));
}

export async function normalizeVisionImageDataUrl(
  dataUrl: string,
): Promise<string> {
  if (!dataUrl.startsWith("data:image/svg+xml")) {
    return dataUrl;
  }

  if (!process.env.STATS_API_URL?.trim()) {
    throw new Error(
      "STATS_API_URL is not configured — cannot rasterize SVG uploads. Upload PNG or JPEG instead.",
    );
  }

  const svgBytes = decodeSvgFromDataUrl(dataUrl);
  const png = await rasterizeSvg(svgBytes);
  return `data:image/png;base64,${Buffer.from(png).toString("base64")}`;
}
