// ============================================================
// Travel Pro — AI Generation Pipeline
//
// Stage 1: Assemble prompt
// Stage 2: Call Claude (claude-haiku-4-5-20251001, maxTokens 10000/8000, temp 0.7, 50s timeout)
// Stage 3: Parse + validate with Zod
// Stage 4: Enrich (visa + weather) in parallel
// Stage 5: Store via Prisma
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SYSTEM_PROMPT_V1, assemblePrompt } from "./prompts/v1";
import { SYSTEM_PROMPT_SINGLE_CITY, assembleSingleCityPrompt } from "./prompts/single-city";
import {
  SYSTEM_PROMPT_ROUTE_ONLY,
  SYSTEM_PROMPT_ROUTE_ONLY_SINGLE_CITY,
  assembleRouteOnlyPrompt,
  assembleRouteOnlySingleCityPrompt,
} from "./prompts/route-only";
import {
  SYSTEM_PROMPT_CITY_ACTIVITIES,
  assembleCityActivitiesPrompt,
} from "./prompts/city-activities";
import { selectRoute } from "./prompts/route-selector";
import { enrichVisa, enrichWeather } from "./enrichment";
import type { UserProfile, TripIntent, Itinerary, TripDay } from "@/types";
import type { CityWithDays } from "@/lib/flights/types";
import { getErrorMessage } from "@/lib/utils/error";
import { createLogger } from "@/lib/logger";

const log = createLogger("pipeline");

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

const claudeItinerarySchema = z.object({
  route: z.array(cityStopSchema),
  days: z.array(tripDaySchema),
});

type ClaudeItinerary = z.infer<typeof claudeItinerarySchema>;

/** Schema for per-city activity generation output. */
const cityActivitiesOutputSchema = z.object({
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
  stopReason: string;
}

async function callClaude(
  userPrompt: string,
  systemPrompt: string = SYSTEM_PROMPT_V1,
  maxTokens: number = 10000,
  retryCount = 0,
): Promise<ClaudeResult> {
  try {
    const message = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Claude returned non-text content");
    }

    const stopReason = message.stop_reason ?? "unknown";
    if (stopReason === "max_tokens") {
      log.warn("Claude output truncated", { maxTokens, outputTokens: message.usage?.output_tokens });
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
    // Content filtering is probabilistic — retry with backoff (usually succeeds on 2nd attempt)
    const msg = getErrorMessage(err);
    const isContentFilter = msg.includes("content filtering") || msg.includes("Output blocked");
    if (isContentFilter && retryCount < 2) {
      log.warn("Content filter triggered, retrying", { attempt: retryCount + 1, maxRetries: 2 });
      await new Promise((r) => setTimeout(r, 600 * (retryCount + 1)));
      return callClaude(userPrompt, systemPrompt, maxTokens, retryCount + 1);
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
// Main: generateCoreItinerary (fast — no enrichment, no DB persist)
// ============================================================

/**
 * Generate the core itinerary (route + days) without enrichment.
 * Returns immediately after Claude parse/validate — visa, weather, and DB
 * persist are deferred to background fetches on the client.
 */
export async function generateCoreItinerary(
  profile: UserProfile,
  tripIntent: TripIntent,
  preSelectedCities?: CityWithDays[]
): Promise<Itinerary> {
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
  const isSingleCityTrip = tripIntent.tripType === "single-city";

  let userPrompt: string;
  let systemPrompt: string;
  let maxTokens: number;

  if (isSingleCityTrip) {
    log.info("Single-city mode", { destination: tripIntent.destination, country: tripIntent.destinationCountry, elapsed: elapsed() });
    userPrompt = assembleSingleCityPrompt(profile, tripIntent);
    systemPrompt = SYSTEM_PROMPT_SINGLE_CITY;
    maxTokens = 8000;
  } else {
    let cities: CityWithDays[] | undefined = preSelectedCities;

    if (!cities) {
      const tA = Date.now();
      try {
        log.info("Stage A: Selecting route with Haiku");
        cities = await selectRoute(profile, tripIntent, getAnthropic());
        log.info("Stage A complete", { duration: `${((Date.now() - tA) / 1000).toFixed(1)}s`, cities: cities.map(c => c.city), elapsed: elapsed() });
      } catch (e) {
        log.warn("Stage A failed, falling back to Claude-only route", { duration: `${((Date.now() - tA) / 1000).toFixed(1)}s`, error: getErrorMessage(e), elapsed: elapsed() });
        cities = undefined;
      }
    } else {
      log.info("Stage A skipped: using pre-selected cities", { count: cities.length, elapsed: elapsed() });
    }

    userPrompt = assemblePrompt(profile, tripIntent, undefined, cities);
    systemPrompt = SYSTEM_PROMPT_V1;
    maxTokens = 10000;
  }

  log.info("Stage 1 (prompt assembly) done", { elapsed: elapsed() });

  // Stage 2: Call Claude
  const t2 = Date.now();
  log.info("Stage 2: Calling Claude Haiku", { tripId: tripIntent.id });
  const claudeResult = await callClaude(userPrompt, systemPrompt, maxTokens);
  const claudeDuration = ((Date.now() - t2) / 1000).toFixed(1);
  log.info("Stage 2 complete", { duration: `${claudeDuration}s`, model: claudeResult.model, inputTokens: claudeResult.inputTokens, outputTokens: claudeResult.outputTokens, elapsed: elapsed() });

  // Stage 3: Parse + validate
  const t3 = Date.now();
  const parsed = parseAndValidate(claudeResult.text);
  log.info("Stage 3 (parse+validate) done", { duration: `${((Date.now() - t3) / 1000).toFixed(1)}s`, cities: parsed.route.length, days: parsed.days.length, elapsed: elapsed() });

  log.info("Core generation complete (enrichment deferred)", { tripId: tripIntent.id, elapsed: elapsed() });
  return parsed;
}

// ============================================================
// Route-Only Generation (no activities)
// ============================================================

/**
 * Generate only the route and day stubs (empty activities).
 * Much faster/cheaper than full generation — activities are added per-city later.
 */
export async function generateRouteOnly(
  profile: UserProfile,
  tripIntent: TripIntent,
  preSelectedCities?: CityWithDays[]
): Promise<Itinerary> {
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
  const isSingleCityTrip = tripIntent.tripType === "single-city";

  let userPrompt: string;
  let systemPrompt: string;
  let maxTokens: number;

  if (isSingleCityTrip) {
    log.info("Route-only: single-city mode", { destination: tripIntent.destination, elapsed: elapsed() });
    userPrompt = assembleRouteOnlySingleCityPrompt(profile, tripIntent);
    systemPrompt = SYSTEM_PROMPT_ROUTE_ONLY_SINGLE_CITY;
    maxTokens = 2000;
  } else {
    let cities: CityWithDays[] | undefined = preSelectedCities;

    if (!cities) {
      const tA = Date.now();
      try {
        log.info("Route-only Stage A: Selecting route with Haiku");
        cities = await selectRoute(profile, tripIntent, getAnthropic());
        log.info("Route-only Stage A complete", { duration: `${((Date.now() - tA) / 1000).toFixed(1)}s`, cities: cities.map(c => c.city), elapsed: elapsed() });
      } catch (e) {
        log.warn("Route-only Stage A failed, falling back", { error: getErrorMessage(e), elapsed: elapsed() });
        cities = undefined;
      }
    }

    userPrompt = assembleRouteOnlyPrompt(profile, tripIntent, undefined, cities);
    systemPrompt = SYSTEM_PROMPT_ROUTE_ONLY;
    maxTokens = 2000;
  }

  log.info("Route-only prompt assembled", { elapsed: elapsed() });

  const t2 = Date.now();
  const claudeResult = await callClaude(userPrompt, systemPrompt, maxTokens);
  log.info("Route-only Claude call complete", {
    duration: `${((Date.now() - t2) / 1000).toFixed(1)}s`,
    model: claudeResult.model,
    inputTokens: claudeResult.inputTokens,
    outputTokens: claudeResult.outputTokens,
    elapsed: elapsed(),
  });

  const parsed = parseAndValidate(claudeResult.text);
  log.info("Route-only generation complete", { tripId: tripIntent.id, cities: parsed.route.length, days: parsed.days.length, elapsed: elapsed() });
  return parsed;
}

// ============================================================
// Per-City Activity Generation
// ============================================================

/**
 * Generate activities for a single city within an existing route-only itinerary.
 * Returns the updated TripDay[] for that city with activities populated.
 */
export async function generateCityActivities(
  profile: UserProfile,
  tripIntent: TripIntent,
  itinerary: Itinerary,
  cityId: string
): Promise<TripDay[]> {
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  const cityStop = itinerary.route.find((r) => r.id === cityId);
  if (!cityStop) {
    throw new Error(`City "${cityId}" not found in itinerary route`);
  }

  const cityDays = itinerary.days.filter((d) => d.city === cityStop.city);
  if (cityDays.length === 0) {
    throw new Error(`No days found for city "${cityStop.city}"`);
  }

  // Scale token budget by number of days (~800 tokens/day), floor 2000, cap 8000
  const maxTokens = Math.min(8000, Math.max(2000, cityDays.length * 800));

  log.info("Generating activities for city", { cityId, city: cityStop.city, days: cityDays.length, maxTokens, elapsed: elapsed() });

  const userPrompt = assembleCityActivitiesPrompt(profile, tripIntent, cityStop, cityDays);

  const claudeResult = await callClaude(userPrompt, SYSTEM_PROMPT_CITY_ACTIVITIES, maxTokens);
  log.info("City activities Claude call complete", {
    cityId,
    duration: `${((Date.now() - t0) / 1000).toFixed(1)}s`,
    inputTokens: claudeResult.inputTokens,
    outputTokens: claudeResult.outputTokens,
    elapsed: elapsed(),
  });

  // Parse + validate city activities output
  const json = extractJSON(claudeResult.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error(`City activities output is not valid JSON: ${getErrorMessage(e)}`);
  }

  const result = cityActivitiesOutputSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`City activities schema validation failed: ${issues}`);
  }

  log.info("City activities generation complete", {
    cityId,
    daysGenerated: result.data.days.length,
    totalActivities: result.data.days.reduce((sum, d) => sum + d.activities.length, 0),
    elapsed: elapsed(),
  });

  return result.data.days;
}

// ============================================================
// Full pipeline: generateItinerary (core + enrichment + persist)
// ============================================================

export async function generateItinerary(
  profile: UserProfile,
  tripIntent: TripIntent,
  preSelectedCities?: CityWithDays[]
): Promise<Itinerary> {
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  const core = await generateCoreItinerary(profile, tripIntent, preSelectedCities);

  // Stage 4: Enrich (visa + weather) in parallel
  const t4 = Date.now();
  const [visaData, weatherData] = await Promise.all([
    enrichVisa(profile.nationality, core.route),
    enrichWeather(core.route, tripIntent.dateStart),
  ]);
  log.info("Stage 4 (enrich) done", { duration: `${((Date.now() - t4) / 1000).toFixed(1)}s`, visaEntries: visaData.length, weatherEntries: weatherData.length, elapsed: elapsed() });

  const itinerary: Itinerary = {
    ...core,
    visaData,
    weatherData,
  };

  // Stage 5: Persist via Prisma (best-effort)
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
    log.info("Stage 5 (DB persist) done", { duration: `${((Date.now() - t5) / 1000).toFixed(1)}s`, elapsed: elapsed() });
  } catch (e) {
    log.error("Stage 5 (DB persist) failed", { duration: `${((Date.now() - t5) / 1000).toFixed(1)}s`, error: getErrorMessage(e), elapsed: elapsed() });
  }

  log.info("Full generation complete", { tripId: tripIntent.id, elapsed: elapsed() });
  return itinerary;
}
