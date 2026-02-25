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

// ── Zod schemas ───────────────────────────────────────────────

const dayActivitySchema = z.object({
  name: z.string(),
  category: z.string(),
  icon: z.string().optional(),
  why: z.string(),
  duration: z.string(),
  tip: z.string().optional(),
  food: z.string().optional(),
  cost: z.string().optional(),
});

const tripDaySchema = z.object({
  day: z.number(),
  date: z.string(),
  city: z.string(),
  activities: z.array(dayActivitySchema),
  isTravel: z.boolean().optional(),
  travelFrom: z.string().optional(),
  travelTo: z.string().optional(),
  travelDuration: z.string().optional(),
});

const cityStopSchema = z.object({
  id: z.string(),
  city: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  days: z.number(),
  countryCode: z.string(),
  iataCode: z.string().optional(),
});

const claudeItinerarySchema = z.object({
  route: z.array(cityStopSchema),
  days: z.array(tripDaySchema),
});

export type ClaudeItinerary = z.infer<typeof claudeItinerarySchema>;

/** Schema for per-city activity generation output. */
export const cityActivitiesOutputSchema = z.object({
  days: z.array(
    z.object({
      day: z.number(),
      date: z.string(),
      city: z.string(),
      isTravel: z.boolean().optional(),
      travelFrom: z.string().optional(),
      travelTo: z.string().optional(),
      travelDuration: z.string().optional(),
      activities: z.array(dayActivitySchema),
    })
  ),
});

// ── Helpers ───────────────────────────────────────────────────

/**
 * Extract raw JSON from Claude's response.
 * Claude might occasionally wrap output in markdown fences despite instructions.
 * Exported for unit testing.
 */
export function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Find the outermost JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text.trim();
}

/**
 * Parse and validate the full itinerary JSON from Claude's raw text.
 * Throws a descriptive error if the output is not valid JSON or fails the schema.
 * Exported for unit testing.
 */
export function parseAndValidate(rawOutput: string): ClaudeItinerary {
  const json = extractJSON(rawOutput);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error(`Claude output is not valid JSON: ${getErrorMessage(e)}`);
  }

  const result = claudeItinerarySchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Itinerary schema validation failed: ${issues}`);
  }

  return result.data;
}
