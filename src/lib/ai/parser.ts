// ============================================================
// Travel Pro — AI Output Parser + Validator
//
// Owns:
//   - extractJSON()  — strip markdown fences, find outermost {}
//   - parseAndValidate()  — JSON.parse + Zod schema check
//   - Zod schemas for all Claude output shapes
// ============================================================

import { z } from "zod";
import { getErrorMessage } from "@/lib/utils/error";
import { itineraryCoreSchema } from "@/lib/itinerary/schema";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("ai:parser");

// ── Zod schemas ───────────────────────────────────────────────

const claudeItinerarySchema = itineraryCoreSchema;

type ClaudeItinerary = z.infer<typeof claudeItinerarySchema>;

// ── Helpers ───────────────────────────────────────────────────

/**
 * Extract raw JSON from Claude's response.
 * Claude might occasionally wrap output in markdown fences despite instructions.
 * Exported for unit testing.
 */
export function extractJSON(text: string): string {
  const inputLength = text.length;

  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    const extracted = fenced[1].trim();
    log.info("extractJSON: stripped markdown fences", {
      inputLength,
      extractedLength: extracted.length,
    });
    return extracted;
  }

  // Find the outermost JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const extracted = text.slice(start, end + 1);
    log.info("extractJSON: found JSON object braces", {
      inputLength,
      extractedLength: extracted.length,
      startIndex: start,
      endIndex: end,
      prefixSkipped: start > 0 ? text.slice(0, Math.min(start, 80)) : null,
    });
    return extracted;
  }

  log.warn("extractJSON: no JSON object found, returning trimmed text", {
    inputLength,
    textPreview: text.slice(0, 200),
  });
  return text.trim();
}

/**
 * Parse and validate the full itinerary JSON from Claude's raw text.
 * Throws a descriptive error if the output is not valid JSON or fails the schema.
 * Exported for unit testing.
 */
export function parseAndValidate(rawOutput: string): ClaudeItinerary {
  log.info("parseAndValidate: starting", { rawOutputLength: rawOutput.length });

  const json = extractJSON(rawOutput);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
    log.info("parseAndValidate: JSON.parse succeeded", {
      parsedType: typeof parsed,
      isObject: typeof parsed === "object" && parsed !== null,
      topLevelKeys: typeof parsed === "object" && parsed !== null ? Object.keys(parsed) : null,
    });
  } catch (e) {
    log.error("parseAndValidate: JSON.parse failed", {
      error: getErrorMessage(e),
      jsonLength: json.length,
      jsonPreview: json.slice(0, 300),
      jsonSuffix: json.slice(-200),
    });
    throw new Error(`Claude output is not valid JSON: ${getErrorMessage(e)}`);
  }

  const result = claudeItinerarySchema.safeParse(parsed);
  if (!result.success) {
    const allIssues = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
      code: i.code,
    }));
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    log.error("parseAndValidate: schema validation failed", {
      totalIssues: result.error.issues.length,
      issues: allIssues.slice(0, 10),
      topLevelKeys: typeof parsed === "object" && parsed !== null ? Object.keys(parsed) : null,
      rawOutputPreview: rawOutput.slice(0, 300),
    });
    throw new Error(`Itinerary schema validation failed: ${issues}`);
  }

  log.info("parseAndValidate: validation passed", {
    routeLength: result.data.route.length,
    daysLength: result.data.days.length,
    cities: result.data.route.map((r) => r.city),
  });

  return result.data;
}
