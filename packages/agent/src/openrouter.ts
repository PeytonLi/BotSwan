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
    };
  }>;
  usage?: OpenRouterUsageResponse;
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
      const response = await fetchFn(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: completionOptions.model ?? defaultModel,
          messages: completionOptions.messages,
          temperature:
            completionOptions.temperature ?? DEFAULT_LLM_PARAMS.temperature,
          top_p: completionOptions.top_p ?? DEFAULT_LLM_PARAMS.top_p,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          `OpenRouter request failed (${response.status}): ${detail}`,
        );
      }

      const data = (await response.json()) as OpenRouterCompletionResponse;
      const content = data.choices?.[0]?.message?.content ?? "";

      return {
        content,
        usage: parseUsage(data.usage),
      };
    },
  };
}
