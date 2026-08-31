import {
  DEFAULT_LLM_PARAMS,
  MODEL,
  OPENROUTER_BASE,
} from "@botswan/shared";
import type { TokenUsage } from "@botswan/shared";

export type ChatRole = "system" | "user" | "assistant";

export type TextContentPart = {
  type: "text";
  text: string;
};

export type ImageContentPart = {
  type: "image_url";
  image_url: { url: string };
};

export type ContentPart = TextContentPart | ImageContentPart;

export type ChatMessage =
  | { role: ChatRole; content: string }
  | { role: ChatRole; content: ContentPart[] };

export interface CompletionUsage extends TokenUsage {}

export interface CompletionResult {
  content: string;
  usage: CompletionUsage;
}

export interface CreateCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  top_p?: number;
  /** Request JSON output and lower reasoning effort for structured pipeline steps. */
  jsonMode?: boolean;
}

export interface OpenRouterClient {
  createCompletion(options: CreateCompletionOptions): Promise<CompletionResult>;
}

export interface OpenRouterClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  defaultModel?: string;
}

interface OpenRouterUsageResponse {
  prompt_tokens?: number;
  completion_tokens?: number;
  reasoning_tokens?: number;
  total_tokens?: number;
}

interface OpenRouterCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning?: string | null;
    };
  }>;
  usage?: OpenRouterUsageResponse;
}

export function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1);
  }

  return trimmed;
}

export function buildVisionMessage(
  prompt: string,
  imageDataUrl: string,
): ChatMessage {
  return {
    role: "user",
    content: [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: imageDataUrl } },
    ],
  };
}

function parseUsage(usage?: OpenRouterUsageResponse): CompletionUsage {
  return {
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
    reasoningTokens: usage?.reasoning_tokens ?? 0,
  };
}

export function createOpenRouterClient(
  options: OpenRouterClientOptions,
): OpenRouterClient {
  const baseUrl = options.baseUrl ?? OPENROUTER_BASE;
  const fetchFn = options.fetch ?? fetch;
  const defaultModel = options.defaultModel ?? MODEL;

  return {
    async createCompletion(
      completionOptions: CreateCompletionOptions,
    ): Promise<CompletionResult> {
      const body: Record<string, unknown> = {
        model: completionOptions.model ?? defaultModel,
        messages: completionOptions.messages,
        temperature:
          completionOptions.temperature ?? DEFAULT_LLM_PARAMS.temperature,
        top_p: completionOptions.top_p ?? DEFAULT_LLM_PARAMS.top_p,
      };

      if (completionOptions.jsonMode) {
        body.response_format = { type: "json_object" };
        // GLM-5.3 Flash defaults to max reasoning; keep structured steps in content.
        body.reasoning = { effort: "low" };
      }

      const response = await fetchFn(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://botswan.vercel.app",
          "X-Title": "BotSwan",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          `OpenRouter request failed (${response.status}): ${detail}`,
        );
      }

      const data = (await response.json()) as OpenRouterCompletionResponse;
      const message = data.choices?.[0]?.message;
      const content = message?.content?.trim() || message?.reasoning?.trim() || "";

      return {
        content,
        usage: parseUsage(data.usage),
      };
    },
  };
}
