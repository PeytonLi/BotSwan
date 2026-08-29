import { NextResponse } from "next/server";
import { startAudit } from "@/lib/audit-service";
import {
  parseAuditRequest,
  resolveImageDataUrl,
} from "@/lib/parse-audit-request";
import { getSessionIdFromRequest, SESSION_COOKIE_NAME } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = await parseAuditRequest(request);
    const imageDataUrl = await resolveImageDataUrl(parsed);

    const sessionId = getSessionIdFromRequest(request);
    const result = await startAudit({
      sessionId,
      input: parsed.input,
      imageDataUrl,
    });

    const response = NextResponse.json(result);
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message.includes("required") ||
      message.includes("not configured") ||
      message.includes("missing")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
