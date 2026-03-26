// ============================================================
// Travel Pro — Anthropic Client + Claude caller
//
// Owns:
//   - Lazy Anthropic client instantiation
//   - callClaude() with content-filter retry logic
//   - ClaudeResult type
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { getErrorMessage } from "@/lib/utils/error";
import { createLogger } from "@/lib/core/logger";
import { abortableDelay, isAbortError } from "@/lib/core/abort";
import { getAnthropicApiKey } from "@/lib/config/server-env";
import {
  CLAUDE_TIMEOUT_MS,
  CONTENT_FILTER_MAX_RETRIES,
  CONTENT_FILTER_BACKOFF_MS,
} from "@/lib/config/constants";

const log = createLogger("ai:client");

// ── Lazy client ───────────────────────────────────────────────

let _anthropic: Anthropic | undefined;

export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: getAnthropicApiKey(),
      timeout: CLAUDE_TIMEOUT_MS,
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
  systemPrompt: string = "",
  maxTokens: number = 10000,
  retryCount = 0,
  signal?: AbortSignal
): Promise<ClaudeResult> {
  const t0 = Date.now();
  const model = "claude-haiku-4-5-20251001";

  log.info("Calling Claude API", {
    model,
    maxTokens,
    temperature: 0.7,
    retryCount,
    userPromptLength: userPrompt.length,
    systemPromptLength: systemPrompt.length,
    timeoutMs: CLAUDE_TIMEOUT_MS,
  });

  try {
    const message = await getAnthropic().messages.create(
      {
        model,
        max_tokens: maxTokens,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
      { signal }
    );

    const duration = `${Date.now() - t0}ms`;
    const block = message.content[0];

    log.info("Claude API response received", {
      duration,
      model: message.model,
      stopReason: message.stop_reason,
      inputTokens: message.usage?.input_tokens,
      outputTokens: message.usage?.output_tokens,
      contentBlockType: block?.type,
      contentBlockCount: message.content.length,
      messageId: message.id,
    });

    if (block.type !== "text") {
      log.error("Claude returned non-text content", {
        duration,
        contentBlockType: block.type,
        contentBlockCount: message.content.length,
        model: message.model,
        stopReason: message.stop_reason,
      });
      throw new Error("Claude returned non-text content");
    }

    const stopReason = message.stop_reason ?? "unknown";
    if (stopReason === "max_tokens") {
      log.warn("Claude output truncated — max_tokens reached", {
        duration,
        maxTokens,
        outputTokens: message.usage?.output_tokens,
        inputTokens: message.usage?.input_tokens,
        model: message.model,
        outputPreview: block.text.slice(-200),
      });
      throw new Error(
        `Claude output was truncated at ${message.usage?.output_tokens} tokens (limit: ${maxTokens}). The itinerary was too long for the current token budget.`
      );
    }

    log.info("Claude call successful", {
      duration,
      stopReason,
      outputLength: block.text.length,
    });

    return {
      text: block.text,
      inputTokens: message.usage?.input_tokens ?? 0,
      outputTokens: message.usage?.output_tokens ?? 0,
      model: message.model ?? "unknown",
      stopReason,
    };
  } catch (err) {
    const duration = `${Date.now() - t0}ms`;

    if (isAbortError(err)) {
      log.info("Claude call aborted", { duration, retryCount });
      throw err;
    }

    // Content filtering is probabilistic — retry with backoff (usually succeeds on 2nd attempt)
    const msg = getErrorMessage(err);
    const isContentFilter = msg.includes("content filtering") || msg.includes("Output blocked");

    log.error("Claude API call failed", {
      duration,
      retryCount,
      errorName: err instanceof Error ? err.name : "unknown",
      error: msg,
      isContentFilter,
      stack: err instanceof Error ? err.stack : undefined,
      statusCode: (err as { status?: number })?.status,
      errorType: err?.constructor?.name,
    });

    if (isContentFilter && retryCount < CONTENT_FILTER_MAX_RETRIES) {
      const backoffMs = CONTENT_FILTER_BACKOFF_MS * (retryCount + 1);
      log.warn("Content filter triggered — retrying with backoff", {
        attempt: retryCount + 1,
        maxRetries: CONTENT_FILTER_MAX_RETRIES,
        backoffMs,
      });
      await abortableDelay(backoffMs, signal);
      return callClaude(userPrompt, systemPrompt, maxTokens, retryCount + 1, signal);
    }
    throw err;
  }
}
