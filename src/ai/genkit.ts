/**
 * @fileOverview OpenRouter API client — replaces Genkit/Gemini.
 * Drop this file at: src/ai/genkit.ts
 * Set OPENROUTER_API_KEY in your .env.local
 */

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Free model fallback lists — OpenRouter tries each in order,
 * automatically picking the first available one.
 * No API key or credits needed for any of these.
 */
export const FREE_MODELS = {
  // For text-only flows: reasoning, MCQs, summaries, analysis
  text: [
    "google/gemma-3-27b-it:free",
    "google/gemma-3-12b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen3-8b:free",
    "deepseek/deepseek-r1-0528:free",
  ],
  // For flows that include an image input
  vision: [
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "google/gemma-3-27b-it:free",
    "google/gemma-3-12b-it:free",
    "qwen/qwen2.5-vl-7b-instruct:free",
  ],
} as const;

export type OpenRouterMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

interface CallOptions {
  models?: readonly string[]; // pass FREE_MODELS.text or FREE_MODELS.vision
  maxTokens?: number;
  temperature?: number;
}

/**
 * Core OpenRouter fetch wrapper.
 * Passes a `models` array so OpenRouter auto-selects the first available free model.
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: CallOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to your .env.local file."
    );
  }

  const models = options.models ?? FREE_MODELS.text;

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:9002",
      "X-Title": "ExamForge AI",
    },
    body: JSON.stringify({
      // `models` array = OpenRouter auto-picks first available free model
      models,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `OpenRouter API error ${response.status}: ${
        (err as { error?: { message?: string } })?.error?.message ?? response.statusText
      }`
    );
  }

  const json = await response.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("OpenRouter returned an empty response.");
  return content;
}

/**
 * Calls OpenRouter and parses the response as JSON.
 * Strips markdown code fences if the model wraps output in them.
 */
export async function callOpenRouterJSON<T>(
  messages: OpenRouterMessage[],
  options: CallOptions = {}
): Promise<T> {
  const raw = await callOpenRouter(messages, options);
  // Strip ```json ... ``` or ``` ... ``` wrappers
  const clean = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(clean) as T;
  } catch {
    throw new Error(
      `Failed to parse model response as JSON.\nRaw response:\n${raw}`
    );
  }
}
