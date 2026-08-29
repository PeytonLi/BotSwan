import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "botswan_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function createSessionId(): string {
  return randomUUID();
}

export function parseSessionCookieValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length < 8) return null;
  return trimmed;
}

export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = parseSessionCookieValue(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  );

  if (existing) {
    return existing;
  }

  const sessionId = createSessionId();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return sessionId;
}

export function getSessionIdFromRequest(request: Request): string {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`),
  );
  const parsed = parseSessionCookieValue(match?.[1]);
  return parsed ?? createSessionId();
}
