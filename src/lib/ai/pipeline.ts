// ============================================================
// Travel Pro — AI Generation Pipeline (orchestrator)
//
// Stage 1: Assemble prompt      (prompts/*)
// Stage 2: Call Claude          (client.ts → callClaude)
// Stage 3: Parse + validate     (parser.ts → parseAndValidate)
// Stage 4: Enrich               (enrichment.ts → enrichVisa, enrichWeather)
// Stage 5: Store via Prisma     (best-effort, non-blocking)
// ============================================================

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
import { callClaude, getAnthropic } from "./client";
import { parseAndValidate, extractJSON, cityActivitiesOutputSchema } from "./parser";
import type { UserProfile, TripIntent, Itinerary, TripDay } from "@/types";
import type { CityWithDays } from "@/lib/flights/types";
import { getErrorMessage } from "@/lib/utils/error";
import { createLogger } from "@/lib/logger";
import { discoverNewCities } from "@/lib/services/city-discovery";
import { throwIfAborted } from "@/lib/abort";

const log = createLogger("pipeline");

// ============================================================
// generateCoreItinerary (route + days, no enrichment)
// ============================================================

/**
 * Generate the core itinerary (route + days) without enrichment.
 * Returns immediately after Claude parse/validate — visa, weather, and DB
 * persist are deferred to background fetches on the client.
 */
export async function generateCoreItinerary(
  profile: UserProfile,
  tripIntent: TripIntent,
  preSelectedCities?: CityWithDays[],
  options?: { signal?: AbortSignal }
): Promise<Itinerary> {
  const signal = options?.signal;
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
  const isSingleCityTrip = tripIntent.tripType === "single-city";
  throwIfAborted(signal);

  let userPrompt: string;
  let systemPrompt: string;
  let maxTokens: number;

  if (isSingleCityTrip) {
    log.info("Single-city mode", {
      destination: tripIntent.destination,
      country: tripIntent.destinationCountry,
      elapsed: elapsed(),
    });
    userPrompt = assembleSingleCityPrompt(profile, tripIntent);
    systemPrompt = SYSTEM_PROMPT_SINGLE_CITY;
    maxTokens = 8000;
  } else {
    let cities: CityWithDays[] | undefined = preSelectedCities;

    if (!cities) {
      const tA = Date.now();
      try {
        log.info("Stage A: Selecting route with Haiku");
        cities = await selectRoute(profile, tripIntent, getAnthropic(), signal);
        log.info("Stage A complete", {
          duration: `${((Date.now() - tA) / 1000).toFixed(1)}s`,
          cities: cities.map((c) => c.city),
          elapsed: elapsed(),
        });
      } catch (e) {
        log.warn("Stage A failed, falling back to Claude-only route", {
          duration: `${((Date.now() - tA) / 1000).toFixed(1)}s`,
          error: getErrorMessage(e),
          elapsed: elapsed(),
        });
        cities = undefined;
      }
    } else {
      log.info("Stage A skipped: using pre-selected cities", {
        count: cities.length,
        elapsed: elapsed(),
      });
    }

    userPrompt = assemblePrompt(profile, tripIntent, undefined, cities);
    systemPrompt = SYSTEM_PROMPT_V1;
    maxTokens = 10000;
  }

  log.info("Stage 1 (prompt assembly) done", { elapsed: elapsed() });

  // Stage 2: Call Claude
  const t2 = Date.now();
  log.info("Stage 2: Calling Claude Haiku", { tripId: tripIntent.id });
  const claudeResult = await callClaude(userPrompt, systemPrompt, maxTokens, 0, signal);
  const claudeDuration = ((Date.now() - t2) / 1000).toFixed(1);
  log.info("Stage 2 complete", {
    duration: `${claudeDuration}s`,
    model: claudeResult.model,
    inputTokens: claudeResult.inputTokens,
    outputTokens: claudeResult.outputTokens,
    elapsed: elapsed(),
  });

  // Stage 3: Parse + validate
  throwIfAborted(signal);
  const t3 = Date.now();
  const parsed = parseAndValidate(claudeResult.text);
  log.info("Stage 3 (parse+validate) done", {
    duration: `${((Date.now() - t3) / 1000).toFixed(1)}s`,
    cities: parsed.route.length,
    days: parsed.days.length,
    elapsed: elapsed(),
  });

  log.info("Core generation complete (enrichment deferred)", {
    tripId: tripIntent.id,
    elapsed: elapsed(),
  });

  // Best-effort: discover unknown cities (non-blocking)
  discoverNewCities(parsed.route, tripIntent.id).catch(() => {});

  return parsed;
}

// ============================================================
// generateRouteOnly (route + empty day stubs, no activities)
// ============================================================

/**
 * Generate only the route and day stubs (empty activities).
 * Much faster/cheaper than full generation — activities are added per-city later.
 */
export async function generateRouteOnly(
  profile: UserProfile,
  tripIntent: TripIntent,
  preSelectedCities?: CityWithDays[],
  options?: { signal?: AbortSignal }
): Promise<Itinerary> {
  const signal = options?.signal;
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
  const isSingleCityTrip = tripIntent.tripType === "single-city";
  throwIfAborted(signal);

  let userPrompt: string;
  let systemPrompt: string;
  let maxTokens: number;

  if (isSingleCityTrip) {
    log.info("Route-only: single-city mode", {
      destination: tripIntent.destination,
      elapsed: elapsed(),
    });
    userPrompt = assembleRouteOnlySingleCityPrompt(profile, tripIntent);
    systemPrompt = SYSTEM_PROMPT_ROUTE_ONLY_SINGLE_CITY;
    maxTokens = 2000;
  } else {
    let cities: CityWithDays[] | undefined = preSelectedCities;

    if (!cities) {
      const tA = Date.now();
      try {
        log.info("Route-only Stage A: Selecting route with Haiku");
        cities = await selectRoute(profile, tripIntent, getAnthropic(), signal);
        log.info("Route-only Stage A complete", {
          duration: `${((Date.now() - tA) / 1000).toFixed(1)}s`,
          cities: cities.map((c) => c.city),
          elapsed: elapsed(),
        });
      } catch (e) {
        log.warn("Route-only Stage A failed, falling back", {
          error: getErrorMessage(e),
          elapsed: elapsed(),
        });
        cities = undefined;
      }
    }

    userPrompt = assembleRouteOnlyPrompt(profile, tripIntent, undefined, cities);
    systemPrompt = SYSTEM_PROMPT_ROUTE_ONLY;
    maxTokens = 2000;
  }

  log.info("Route-only prompt assembled", { elapsed: elapsed() });

  const t2 = Date.now();
  const claudeResult = await callClaude(userPrompt, systemPrompt, maxTokens, 0, signal);
  log.info("Route-only Claude call complete", {
    duration: `${((Date.now() - t2) / 1000).toFixed(1)}s`,
    model: claudeResult.model,
    inputTokens: claudeResult.inputTokens,
    outputTokens: claudeResult.outputTokens,
    elapsed: elapsed(),
  });

  throwIfAborted(signal);
  const parsed = parseAndValidate(claudeResult.text);
  log.info("Route-only generation complete", {
    tripId: tripIntent.id,
    cities: parsed.route.length,
    days: parsed.days.length,
    elapsed: elapsed(),
  });

  // Best-effort: discover unknown cities (non-blocking)
  discoverNewCities(parsed.route, tripIntent.id).catch(() => {});

  return parsed;
}

// ============================================================
// generateCityActivities (per-city, fills empty day stubs)
// ============================================================

/**
 * Generate activities for a single city within an existing route-only itinerary.
 * Returns the updated TripDay[] for that city with activities populated.
 */
export async function generateCityActivities(
  profile: UserProfile,
  tripIntent: TripIntent,
  itinerary: Itinerary,
  cityId: string,
  options?: { signal?: AbortSignal }
): Promise<TripDay[]> {
  const signal = options?.signal;
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
  throwIfAborted(signal);

  const cityStop = itinerary.route.find((r) => r.id === cityId);
  if (!cityStop) {
    throw new Error(`City "${cityId}" not found in itinerary route`);
  }

  const cityDays = itinerary.days.filter((d) => d.city === cityStop.city);
  if (cityDays.length === 0) {
    throw new Error(`No days found for city "${cityStop.city}"`);
  }

  const maxTokens = 8000;

  log.info("Generating activities for city", {
    cityId,
    city: cityStop.city,
    days: cityDays.length,
    maxTokens,
    elapsed: elapsed(),
  });

  const userPrompt = assembleCityActivitiesPrompt(profile, tripIntent, cityStop, cityDays);

  const claudeResult = await callClaude(
    userPrompt,
    SYSTEM_PROMPT_CITY_ACTIVITIES,
    maxTokens,
    0,
    signal
  );
  log.info("City activities Claude call complete", {
    cityId,
    duration: `${((Date.now() - t0) / 1000).toFixed(1)}s`,
    inputTokens: claudeResult.inputTokens,
    outputTokens: claudeResult.outputTokens,
    elapsed: elapsed(),
  });

  // Parse + validate city activities output
  throwIfAborted(signal);
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
// generateItinerary (full pipeline: core + enrichment + persist)
// ============================================================

export async function generateItinerary(
  profile: UserProfile,
  tripIntent: TripIntent,
  preSelectedCities?: CityWithDays[],
  options?: { signal?: AbortSignal }
): Promise<Itinerary> {
  const signal = options?.signal;
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  const core = await generateCoreItinerary(profile, tripIntent, preSelectedCities, { signal });

  // Stage 4: Enrich (visa + weather) in parallel
  throwIfAborted(signal);
  const t4 = Date.now();
  const [visaData, weatherData] = await Promise.all([
    enrichVisa(profile.nationality, core.route),
    enrichWeather(core.route, tripIntent.dateStart),
  ]);
  log.info("Stage 4 (enrich) done", {
    duration: `${((Date.now() - t4) / 1000).toFixed(1)}s`,
    visaEntries: visaData.length,
    weatherEntries: weatherData.length,
    elapsed: elapsed(),
  });

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
    log.info("Stage 5 (DB persist) done", {
      duration: `${((Date.now() - t5) / 1000).toFixed(1)}s`,
      elapsed: elapsed(),
    });
  } catch (e) {
    log.error("Stage 5 (DB persist) failed", {
      duration: `${((Date.now() - t5) / 1000).toFixed(1)}s`,
      error: getErrorMessage(e),
      elapsed: elapsed(),
    });
  }

  log.info("Full generation complete", { tripId: tripIntent.id, elapsed: elapsed() });
  return itinerary;
}

// ── Re-export parser utilities for backwards compatibility ────
// (unit tests import extractJSON and parseAndValidate from pipeline.ts)
export { extractJSON, parseAndValidate } from "./parser";
