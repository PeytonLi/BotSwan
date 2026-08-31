import type { AuditInput, InputType } from "@botswan/shared";

export interface ParsedAuditRequest {
  input: AuditInput;
  imageDataUrl?: string;
}

function bufferToDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const mimeType = file.type || "application/octet-stream";
  return bufferToDataUrl(buffer, mimeType);
}

export async function parseAuditRequest(request: Request): Promise<ParsedAuditRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const inputType = (form.get("inputType")?.toString() ?? "upload") as InputType;
    const url = form.get("url")?.toString();
    const imageFile = form.get("image");
    const csvFile = form.get("csv");
    const hasGroundTruthCsv = csvFile instanceof File && csvFile.size > 0;

    const input: AuditInput = {
      type: inputType,
      originalUrl: url,
      hasGroundTruthCsv,
    };

    if (inputType === "url") {
      return { input };
    }

    if (inputType === "pdf") {
      if (!(imageFile instanceof File)) {
        throw new Error("PDF file is required for pdf input type");
      }
      return {
        input,
        imageDataUrl: await fileToDataUrl(imageFile),
      };
    }

    if (imageFile instanceof File && imageFile.size > 0) {
      return {
        input,
        imageDataUrl: await fileToDataUrl(imageFile),
      };
    }

    if (inputType === "paste") {
      const pasted = form.get("imageDataUrl")?.toString();
      if (!pasted) {
        throw new Error("imageDataUrl is required for paste input type");
      }
      return { input, imageDataUrl: pasted };
    }

    throw new Error("image file is required for upload input type");
  }

  const body = (await request.json()) as {
    input?: AuditInput;
    imageDataUrl?: string;
  };

  if (!body.input?.type) {
    throw new Error("input.type is required");
  }

  return {
    input: body.input,
    imageDataUrl: body.imageDataUrl,
  };
}

export async function resolveImageDataUrl(
  parsed: ParsedAuditRequest,
): Promise<string | undefined> {
  if (parsed.input.type === "url") {
    if (parsed.imageDataUrl) {
      return parsed.imageDataUrl;
    }
    if (!parsed.input.originalUrl) {
      throw new Error("url is required for url input type");
    }
    if (!process.env.STATS_API_URL?.trim()) {
      throw new Error(
        "STATS_API_URL is not configured — cannot screenshot URLs. Paste an image instead.",
      );
    }

    const { screenshotUrl } = await import("@/lib/stats-client");
    const png = await screenshotUrl(parsed.input.originalUrl);
    return bufferToDataUrl(png, "image/png");
  }

  if (parsed.input.type === "pdf") {
    if (!parsed.imageDataUrl) {
      throw new Error("PDF bytes missing");
    }
    if (!process.env.STATS_API_URL?.trim()) {
      throw new Error(
        "STATS_API_URL is not configured — cannot extract PDF charts.",
      );
    }

    const pdfBuffer = Buffer.from(
      parsed.imageDataUrl.replace(/^data:[^;]+;base64,/, ""),
      "base64",
    );
    const { extractPdf } = await import("@/lib/stats-client");
    const result = await extractPdf(
      pdfBuffer.buffer.slice(
        pdfBuffer.byteOffset,
        pdfBuffer.byteOffset + pdfBuffer.byteLength,
      ),
    );
    const firstPage = result.pages[0];
    if (!firstPage) {
      throw new Error("PDF contained no pages");
    }
    return `data:image/png;base64,${firstPage.png_base64}`;
  }

  if (parsed.imageDataUrl) {
    const { normalizeVisionImageDataUrl } = await import(
      "@/lib/normalize-vision-image"
    );
    return await normalizeVisionImageDataUrl(parsed.imageDataUrl);
  }

  return parsed.imageDataUrl;
}
