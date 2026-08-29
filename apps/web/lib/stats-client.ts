export interface StatsHealthResponse {
  status: string;
}

export interface StatsExecuteRequest {
  code: string;
  jobId?: string;
}

export interface StatsExecuteResponse {
  stdout: string;
  error: string | null;
}

function getStatsBaseUrl(): string {
  return (process.env.STATS_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
}

export class StatsClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StatsClientError";
  }
}

async function statsFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${getStatsBaseUrl()}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new StatsClientError(
      `Stats API ${path} failed (${response.status}): ${body.slice(0, 200)}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

export async function checkStatsHealth(): Promise<StatsHealthResponse> {
  return statsFetch<StatsHealthResponse>("/health");
}

export async function executeStatsCode(
  payload: StatsExecuteRequest,
): Promise<StatsExecuteResponse> {
  return statsFetch<StatsExecuteResponse>("/execute", {
    method: "POST",
    body: JSON.stringify({ code: payload.code }),
  });
}

export interface StatsRenderRequest {
  chart_type?: string;
  x?: (string | number)[];
  y?: number[];
  title?: string;
}

export async function renderStatsChart(
  payload: StatsRenderRequest,
): Promise<ArrayBuffer> {
  const url = `${getStatsBaseUrl()}/render`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new StatsClientError(
      `Stats API /render failed (${response.status}): ${body.slice(0, 200)}`,
      response.status,
    );
  }

  return response.arrayBuffer();
}

export interface StatsScreenshotResponse {
  png_base64: string;
}

export async function screenshotUrl(url: string): Promise<ArrayBuffer> {
  const data = await statsFetch<StatsScreenshotResponse>("/screenshot-url", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  return Buffer.from(data.png_base64, "base64").buffer;
}

export interface StatsPdfPage {
  page: number;
  png_base64: string;
}

export interface StatsExtractPdfResponse {
  pages: StatsPdfPage[];
}

export async function extractPdf(pdfBytes: ArrayBuffer): Promise<StatsExtractPdfResponse> {
  const url = `${getStatsBaseUrl()}/extract-pdf`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: pdfBytes,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new StatsClientError(
      `Stats API /extract-pdf failed (${response.status}): ${body.slice(0, 200)}`,
      response.status,
    );
  }

  return (await response.json()) as StatsExtractPdfResponse;
}
