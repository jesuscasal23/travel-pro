// ============================================================
// Travel Pro — AI Generation Pipeline
//
// Stage 1: Assemble prompt
// Stage 2: Call Claude (claude-sonnet-4-20250514, maxTokens 5000, temp 0.7, 50s timeout)
// Stage 3: Parse + validate with Zod
// Stage 4: Enrich (visa + weather) in parallel
// Stage 5: Store via Prisma
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SYSTEM_PROMPT_V1, assemblePrompt } from "./prompts/v1";
import { selectRoute } from "./prompts/route-selector";
import { enrichVisa, enrichWeather } from "./enrichment";
import type { UserProfile, TripIntent, Itinerary } from "@/types";
import type { CityWithDays } from "@/lib/flights/types";
import { getErrorMessage } from "@/lib/utils/error";

// ============================================================
// Clients
// ============================================================

let _anthropic: Anthropic | undefined;

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 50_000, // 50s — fail cleanly before Vercel's 60s limit
    });
  }
  return _anthropic;
}

// ============================================================
// Zod Schemas — validate Claude output shape
// ============================================================

const dayActivitySchema = z.object({
  name: z.string(),
  category: z.string(),
  icon: z.string(),
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

const budgetSchema = z.object({
  flights: z.number(),
  accommodation: z.number(),
  activities: z.number(),
  food: z.number(),
  transport: z.number(),
  total: z.number(),
  budget: z.number(),
});

const claudeItinerarySchema = z.object({
  route: z.array(cityStopSchema),
  days: z.array(tripDaySchema),
  budget: budgetSchema,
});

type ClaudeItinerary = z.infer<typeof claudeItinerarySchema>;

// ============================================================
// Helpers
// ============================================================

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

// ============================================================
// Stage 2: Call Claude
// ============================================================

interface ClaudeResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

async function callClaude(userPrompt: string, retryCount = 0): Promise<ClaudeResult> {
  try {
    const message = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000,
      temperature: 0.7,
      system: SYSTEM_PROMPT_V1,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Claude returned non-text content");
    }

    return {
      text: block.text,
      inputTokens: message.usage?.input_tokens ?? 0,
      outputTokens: message.usage?.output_tokens ?? 0,
      model: message.model ?? "unknown",
    };
  } catch (err) {
    // Content filtering is probabilistic — retry with backoff (usually succeeds on 2nd attempt)
    const msg = getErrorMessage(err);
    const isContentFilter = msg.includes("content filtering") || msg.includes("Output blocked");
    if (isContentFilter && retryCount < 2) {
      console.warn(`[pipeline] Content filter triggered, retrying (attempt ${retryCount + 1}/2)`);
      await new Promise((r) => setTimeout(r, 600 * (retryCount + 1)));
      return callClaude(userPrompt, retryCount + 1);
    }
    throw err;
  }
}

// ============================================================
// Stage 3: Parse + validate
// ============================================================

/** Exported for unit testing. */
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

// ============================================================
// Main: generateItinerary
// ============================================================

export async function generateItinerary(
  profile: UserProfile,
  tripIntent: TripIntent,
  preSelectedCities?: CityWithDays[]
): Promise<Itinerary> {
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  // Stage A: Route selection
  // If pre-selected cities are provided (from /api/generate/select-route), skip Haiku call.
  let cities: CityWithDays[] | undefined = preSelectedCities;

  if (!cities) {
    const tA = Date.now();
    try {
      console.log("[pipeline] Stage A: Selecting route with Haiku");
      cities = await selectRoute(profile, tripIntent, getAnthropic());
      console.log(`[pipeline] Stage A complete in ${((Date.now() - tA) / 1000).toFixed(1)}s: ${cities.map(c => c.city).join(", ")} [${elapsed()} total]`);
    } catch (e) {
      console.warn(
        `[pipeline] Stage A failed in ${((Date.now() - tA) / 1000).toFixed(1)}s, falling back to Claude-only route:`,
        getErrorMessage(e),
        `[${elapsed()} total]`
      );
      cities = undefined;
    }
  } else {
    console.log(`[pipeline] Stage A skipped: using ${cities.length} pre-selected cities [${elapsed()} total]`);
  }

  // Stage 1: Assemble prompt (inject city schedule from Stage A when available)
  const userPrompt = assemblePrompt(profile, tripIntent, undefined, cities);
  console.log(`[pipeline] Stage 1 (prompt assembly) done [${elapsed()} total]`);

  // Stage 2: Call Claude
  const t2 = Date.now();
  console.log(`[pipeline] Stage 2: Calling Claude Sonnet for trip ${tripIntent.id}...`);
  const claudeResult = await callClaude(userPrompt);
  const claudeDuration = ((Date.now() - t2) / 1000).toFixed(1);
  console.log(`[pipeline] Stage 2 complete in ${claudeDuration}s — model=${claudeResult.model} input=${claudeResult.inputTokens}tok output=${claudeResult.outputTokens}tok [${elapsed()} total]`);

  // Stage 3: Parse + validate
  const t3 = Date.now();
  const parsed = parseAndValidate(claudeResult.text);
  console.log(
    `[pipeline] Stage 3 (parse+validate) done in ${((Date.now() - t3) / 1000).toFixed(1)}s: ${parsed.route.length} cities, ${parsed.days.length} days [${elapsed()} total]`
  );

  // Stage 4: Enrich (visa + weather) in parallel
  const t4 = Date.now();
  const [visaData, weatherData] = await Promise.all([
    enrichVisa(profile.nationality, parsed.route),
    enrichWeather(parsed.route, tripIntent.dateStart),
  ]);
  console.log(`[pipeline] Stage 4 (enrich) done in ${((Date.now() - t4) / 1000).toFixed(1)}s — ${visaData.length} visa entries, ${weatherData.length} weather entries [${elapsed()} total]`);

  // Stage 5: Combine + store
  const itinerary: Itinerary = {
    ...parsed,
    visaData,
    weatherData,
  };

  // Persist itinerary via Prisma (best-effort — don't fail generation if DB is down)
  const t5 = Date.now();
  try {
    const { getPrisma } = await import("@/lib/db/prisma");
    const existing = await getPrisma().itinerary.findFirst({
      where: { tripId: tripIntent.id, isActive: true },
    });
    if (existing) {
      await getPrisma().itinerary.update({
        where: { id: existing.id },
        data: { data: itinerary as object },
      });
    } else {
      await getPrisma().itinerary.create({
        data: { tripId: tripIntent.id, data: itinerary as object },
      });
    }
    console.log(`[pipeline] Stage 5 (DB persist) done in ${((Date.now() - t5) / 1000).toFixed(1)}s [${elapsed()} total]`);
  } catch (e) {
    console.error(`[pipeline] Stage 5 (DB persist) failed in ${((Date.now() - t5) / 1000).toFixed(1)}s:`, getErrorMessage(e), `[${elapsed()} total]`);
  }

  console.log(`[pipeline] ✓ Generation complete for trip ${tripIntent.id} — total ${elapsed()}`);
  return itinerary;
}
