export interface StatsExecuteResponse {
  stdout: string;
  error: string | null;
}

export interface StatsRenderSpec {
  chart_type: string;
  x: (string | number)[];
  y: number[];
  title?: string;
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

export async function executeStatsCode(
  code: string,
  fetchFn: typeof fetch = fetch,
): Promise<StatsExecuteResponse> {
  const response = await fetchFn(`${getStatsBaseUrl()}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new StatsClientError(
      `Stats /execute failed (${response.status}): ${body.slice(0, 200)}`,
      response.status,
    );
  }

  return (await response.json()) as StatsExecuteResponse;
}

export async function renderStatsChart(
  spec: StatsRenderSpec,
  fetchFn: typeof fetch = fetch,
): Promise<Uint8Array> {
  const response = await fetchFn(`${getStatsBaseUrl()}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(spec),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new StatsClientError(
      `Stats /render failed (${response.status}): ${body.slice(0, 200)}`,
      response.status,
    );
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
