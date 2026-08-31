import { Resvg } from "@resvg/resvg-js";

function decodeSvgFromDataUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) {
    throw new Error("Invalid SVG data URL");
  }

  const meta = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);

  if (meta.includes(";base64")) {
    return Buffer.from(payload, "base64").toString("utf8");
  }

  return decodeURIComponent(payload);
}

export function normalizeVisionImageDataUrl(dataUrl: string): string {
  if (!dataUrl.startsWith("data:image/svg+xml")) {
    return dataUrl;
  }

  const svg = decodeSvgFromDataUrl(dataUrl);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 960 },
  });
  const png = resvg.render().asPng();
  return `data:image/png;base64,${png.toString("base64")}`;
}
