// ============================================================
// Travel Pro — Anthropic Client + Claude caller
//
// Owns:
//   - Lazy Anthropic client instantiation
//   - callClaude() with content-filter retry logic
//   - ClaudeResult type
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT_V1 } from "./prompts/v1";
import { getErrorMessage } from "@/lib/utils/error";
import { createLogger } from "@/lib/logger";
import { abortableDelay, isAbortError } from "@/lib/abort";
import { getAnthropicApiKey } from "@/lib/config/server-env";

const log = createLogger("ai:client");

// ── Lazy client ───────────────────────────────────────────────

let _anthropic: Anthropic | undefined;

export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: getAnthropicApiKey(),
      timeout: 50_000, // 50s — fail cleanly before Vercel's 60s limit
    });
  }
  return _anthropic;
}

// ── Types ─────────────────────────────────────────────────────

interface ClaudeResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  stopReason: string;
}

// ── callClaude ────────────────────────────────────────────────

/**
 * Call Claude Haiku with a user + system prompt.
 * Automatically retries on content filter triggers (max 2 retries, backoff).
 */
export async function callClaude(
  userPrompt: string,
  systemPrompt: string = SYSTEM_PROMPT_V1,
  maxTokens: number = 10000,
  retryCount = 0,
  signal?: AbortSignal
): Promise<ClaudeResult> {
  try {
    const message = await getAnthropic().messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
      { signal }
    );

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Claude returned non-text content");
    }

    const stopReason = message.stop_reason ?? "unknown";
    if (stopReason === "max_tokens") {
      log.warn("Claude output truncated", {
        maxTokens,
        outputTokens: message.usage?.output_tokens,
      });
      throw new Error(
        `Claude output was truncated at ${message.usage?.output_tokens} tokens (limit: ${maxTokens}). The itinerary was too long for the current token budget.`
      );
    }

    return {
      text: block.text,
      inputTokens: message.usage?.input_tokens ?? 0,
      outputTokens: message.usage?.output_tokens ?? 0,
      model: message.model ?? "unknown",
      stopReason,
    };
  } catch (err) {
    if (isAbortError(err)) {
      throw err;
    }
    // Content filtering is probabilistic — retry with backoff (usually succeeds on 2nd attempt)
    const msg = getErrorMessage(err);
    const isContentFilter = msg.includes("content filtering") || msg.includes("Output blocked");
    if (isContentFilter && retryCount < 2) {
      log.warn("Content filter triggered, retrying", { attempt: retryCount + 1, maxRetries: 2 });
      await abortableDelay(600 * (retryCount + 1), signal);
      return callClaude(userPrompt, systemPrompt, maxTokens, retryCount + 1, signal);
    }
    throw err;
  }
}
