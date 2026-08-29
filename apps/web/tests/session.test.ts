import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE_NAME,
  createSessionId,
  parseSessionCookieValue,
} from "@/lib/session";

describe("session", () => {
  it("creates a UUID session id", () => {
    const id = createSessionId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("parses valid cookie values", () => {
    const id = createSessionId();
    expect(parseSessionCookieValue(id)).toBe(id);
  });

  it("rejects empty or short cookie values", () => {
    expect(parseSessionCookieValue(undefined)).toBeNull();
    expect(parseSessionCookieValue("")).toBeNull();
    expect(parseSessionCookieValue("abc")).toBeNull();
  });

  it("uses default cookie name", () => {
    expect(SESSION_COOKIE_NAME).toBeTruthy();
  });
});
