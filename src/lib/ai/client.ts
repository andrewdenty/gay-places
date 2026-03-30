/**
 * Claude API client singleton + typed helper.
 *
 * All AI calls in the codebase go through `callClaude()` so the model,
 * temperature, and token budget are controlled per-task from a single place.
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to your environment variables.",
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export interface CallClaudeOptions {
  system?: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

/**
 * Send a single user message to Claude and return the text response.
 * Throws on API errors or empty responses.
 */
export async function callClaude(
  prompt: string,
  opts: CallClaudeOptions,
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: opts.model,
    max_tokens: opts.max_tokens,
    temperature: opts.temperature,
    ...(opts.system ? { system: opts.system } : {}),
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock?.text?.trim() ?? "";

  if (!text) {
    throw new Error("Claude returned an empty response");
  }

  return text;
}
