import { afterEach, describe, expect, it, vi } from "vitest";
import { buildVisionMessage, createOpenRouterClient } from "../src/openrouter.js";

describe("OpenRouter client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buildVisionMessage creates multimodal content with image_url", () => {
    const message = buildVisionMessage(
      "Extract all statistical claims from this chart.",
      "data:image/png;base64,abc123",
    );

    expect(message).toEqual({
      role: "user",
      content: [
        {
          type: "text",
          text: "Extract all statistical claims from this chart.",
        },
        {
          type: "image_url",
          image_url: { url: "data:image/png;base64,abc123" },
        },
      ],
    });
  });

  it("createCompletion posts to OpenRouter and parses usage", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "gen-123",
        choices: [
          {
            message: {
              role: "assistant",
              content: '{"chartType":"line"}',
            },
          },
        ],
        usage: {
          prompt_tokens: 1500,
          completion_tokens: 250,
          total_tokens: 1750,
        },
      }),
    });

    const client = createOpenRouterClient({
      apiKey: "test-key",
      fetch: fetchMock as typeof fetch,
    });

    const result = await client.createCompletion({
      messages: [
        buildVisionMessage("Analyze chart", "data:image/png;base64,xyz"),
      ],
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("z-ai/glm-5.3-flash");
    expect(body.messages[0].content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "image_url" }),
      ]),
    );

    expect(result.content).toBe('{"chartType":"line"}');
    expect(result.usage).toEqual({
      inputTokens: 1500,
      outputTokens: 250,
      reasoningTokens: 0,
    });
  });

  it("throws on non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    const client = createOpenRouterClient({
      apiKey: "bad-key",
      fetch: fetchMock as typeof fetch,
    });

    await expect(
      client.createCompletion({ messages: [{ role: "user", content: "hi" }] }),
    ).rejects.toThrow("OpenRouter request failed (401)");
  });
});
