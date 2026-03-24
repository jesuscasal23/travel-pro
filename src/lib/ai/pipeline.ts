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
import { SYSTEM_PROMPT_ROUTE_ONLY, assembleRouteOnlyPrompt } from "./prompts/route-only";
import {
  SYSTEM_PROMPT_CITY_ACTIVITIES,
  assembleCityActivitiesPrompt,
} from "./prompts/city-activities";
import { selectRoute } from "./prompts/route-selector";
import { enrichVisa } from "./enrich-visa";
import { enrichWeather } from "./enrich-weather";
import { callClaude, getAnthropic } from "./client";
import { parseAndValidate, extractJSON, cityActivitiesOutputSchema } from "./parser";
import type { UserProfile, TripIntent, Itinerary, TripDay, CityStop } from "@/types";
import { addDays, daysBetween, formatDateShort } from "@/lib/utils/format/date";
import type { CityWithDays } from "@/lib/flights/types";
import { getErrorMessage } from "@/lib/utils/error";
import { createLogger } from "@/lib/core/logger";
import { discoverNewCities } from "@/lib/features/generation/city-discovery";
import { throwIfAborted } from "@/lib/core/abort";
import {
  MAX_TOKENS_MULTI_CITY,
  MAX_TOKENS_SINGLE_CITY,
  MAX_TOKENS_ROUTE_ONLY,
  MAX_TOKENS_CITY_ACTIVITIES,
} from "@/lib/config/constants";

const log = createLogger("pipeline");

// ── Shared Stage A: route selection ─────────────────────────

/**
 * Resolve multi-city route via Haiku. Falls back gracefully if route
 * selection fails (Claude will pick the route inline instead).
 */
async function resolveMultiCityRoute(
  profile: UserProfile,
  tripIntent: TripIntent,
  preSelectedCities: CityWithDays[] | undefined,
  signal: AbortSignal | undefined,
  logPrefix: string,
  elapsed: () => string
): Promise<CityWithDays[] | undefined> {
  if (preSelectedCities) {
    log.info(`${logPrefix} Stage A skipped: using pre-selected cities`, {
      tripId: tripIntent.id,
      count: preSelectedCities.length,
      cities: preSelectedCities.map((c) => ({
        city: c.city,
        country: c.country,
        iataCode: c.iataCode,
        minDays: c.minDays,
        maxDays: c.maxDays,
      })),
      elapsed: elapsed(),
    });
    return preSelectedCities;
  }

  const tA = Date.now();
  try {
    log.info(`${logPrefix} Stage A: Selecting route with Haiku`, {
      tripId: tripIntent.id,
      region: tripIntent.region,
      tripType: tripIntent.tripType,
      travelStyle: profile.travelStyle,
      interests: profile.interests,
    });
    const cities = await selectRoute(profile, tripIntent, getAnthropic(), signal);
    log.info(`${logPrefix} Stage A complete`, {
      tripId: tripIntent.id,
      duration: `${((Date.now() - tA) / 1000).toFixed(1)}s`,
      cityCount: cities.length,
      cities: cities.map((c) => ({
        city: c.city,
        country: c.country,
        countryCode: c.countryCode,
        iataCode: c.iataCode,
        minDays: c.minDays,
        maxDays: c.maxDays,
      })),
      elapsed: elapsed(),
    });
    return cities;
  } catch (e) {
    log.warn(`${logPrefix} Stage A failed, falling back to Claude-only route`, {
      tripId: tripIntent.id,
      duration: `${((Date.now() - tA) / 1000).toFixed(1)}s`,
      errorName: e instanceof Error ? e.name : "unknown",
      error: getErrorMessage(e),
      stack: e instanceof Error ? e.stack : undefined,
      elapsed: elapsed(),
    });
    return undefined;
  }
}

// ── Shared generation helper ──────────────────────────────────

interface PromptConfig {
  singleCity: {
    assemblePrompt: (profile: UserProfile, tripIntent: TripIntent) => string;
    systemPrompt: string;
    maxTokens: number;
  };
  multiCity: {
    assemblePrompt: (
      profile: UserProfile,
      tripIntent: TripIntent,
      flightSkeleton: undefined,
      cities: CityWithDays[] | undefined
    ) => string;
    systemPrompt: string;
    maxTokens: number;
  };
  logPrefix: string;
}

/**
 * Common generation flow: resolve route → assemble prompt → call Claude →
 * parse/validate → discover cities. Used by both core and route-only generation.
 */
async function generateWithConfig(
  config: PromptConfig,
  profile: UserProfile,
  tripIntent: TripIntent,
  preSelectedCities: CityWithDays[] | undefined,
  signal: AbortSignal | undefined
): Promise<Itinerary> {
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
  const prefix = config.logPrefix;
  const isSingleCityTrip = tripIntent.tripType === "single-city";
  throwIfAborted(signal);

  let userPrompt: string;
  let systemPrompt: string;
  let maxTokens: number;

  if (isSingleCityTrip) {
    log.info(`${prefix}Single-city mode`, {
      tripId: tripIntent.id,
      destination: tripIntent.destination,
      country: tripIntent.destinationCountry,
      dateStart: tripIntent.dateStart,
      dateEnd: tripIntent.dateEnd,
      elapsed: elapsed(),
    });
    userPrompt = config.singleCity.assemblePrompt(profile, tripIntent);
    systemPrompt = config.singleCity.systemPrompt;
    maxTokens = config.singleCity.maxTokens;
  } else {
    log.info(`${prefix}Multi-city mode — resolving route`, {
      tripId: tripIntent.id,
      region: tripIntent.region,
      dateStart: tripIntent.dateStart,
      dateEnd: tripIntent.dateEnd,
      elapsed: elapsed(),
    });
    const cities = await resolveMultiCityRoute(
      profile,
      tripIntent,
      preSelectedCities,
      signal,
      prefix,
      elapsed
    );
    userPrompt = config.multiCity.assemblePrompt(profile, tripIntent, undefined, cities);
    systemPrompt = config.multiCity.systemPrompt;
    maxTokens = config.multiCity.maxTokens;
  }

  log.info(`${prefix}Prompt assembled`, {
    tripId: tripIntent.id,
    promptLength: userPrompt.length,
    systemPromptLength: systemPrompt.length,
    maxTokens,
    elapsed: elapsed(),
  });

  // Call Claude
  const t2 = Date.now();
  log.info(`${prefix}Calling Claude Haiku`, {
    tripId: tripIntent.id,
    maxTokens,
    promptLengthChars: userPrompt.length,
  });
  const claudeResult = await callClaude(userPrompt, systemPrompt, maxTokens, 0, signal);
  log.info(`${prefix}Claude call complete`, {
    tripId: tripIntent.id,
    duration: `${((Date.now() - t2) / 1000).toFixed(1)}s`,
    model: claudeResult.model,
    stopReason: claudeResult.stopReason,
    inputTokens: claudeResult.inputTokens,
    outputTokens: claudeResult.outputTokens,
    outputLengthChars: claudeResult.text.length,
    elapsed: elapsed(),
  });

  // Parse + validate
  throwIfAborted(signal);
  const t3 = Date.now();
  log.info(`${prefix}Parsing and validating output`, {
    tripId: tripIntent.id,
    rawOutputLength: claudeResult.text.length,
    rawOutputPreview: claudeResult.text.slice(0, 200),
  });
  const parsed = parseAndValidate(claudeResult.text);
  log.info(`${prefix}Generation complete`, {
    tripId: tripIntent.id,
    duration: `${((Date.now() - t3) / 1000).toFixed(1)}s`,
    routeCities: parsed.route.map((r) => r.city),
    cityCount: parsed.route.length,
    dayCount: parsed.days.length,
    routeCountries: [...new Set(parsed.route.map((r) => r.countryCode))],
    elapsed: elapsed(),
  });

  // Best-effort: discover unknown cities (non-blocking)
  discoverNewCities(parsed.route, tripIntent.id).catch((e) => {
    log.warn("City discovery failed (non-blocking)", { error: getErrorMessage(e) });
  });

  return parsed;
}

// ── Prompt configs ────────────────────────────────────────────

const CORE_PROMPT_CONFIG: PromptConfig = {
  singleCity: {
    assemblePrompt: assembleSingleCityPrompt,
    systemPrompt: SYSTEM_PROMPT_SINGLE_CITY,
    maxTokens: MAX_TOKENS_SINGLE_CITY,
  },
  multiCity: {
    assemblePrompt: assemblePrompt,
    systemPrompt: SYSTEM_PROMPT_V1,
    maxTokens: MAX_TOKENS_MULTI_CITY,
  },
  logPrefix: "",
};

const ROUTE_ONLY_PROMPT_CONFIG: PromptConfig = {
  // Single-city is handled by buildSingleCityRouteOnly() — this branch is never reached.
  singleCity: {
    assemblePrompt: (p, t) => assembleRouteOnlyPrompt(p, t, undefined, undefined),
    systemPrompt: SYSTEM_PROMPT_ROUTE_ONLY,
    maxTokens: MAX_TOKENS_ROUTE_ONLY,
  },
  multiCity: {
    assemblePrompt: assembleRouteOnlyPrompt,
    systemPrompt: SYSTEM_PROMPT_ROUTE_ONLY,
    maxTokens: MAX_TOKENS_ROUTE_ONLY,
  },
  logPrefix: "Route-only: ",
};

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
  return generateWithConfig(
    CORE_PROMPT_CONFIG,
    profile,
    tripIntent,
    preSelectedCities,
    options?.signal
  );
}

// ============================================================
// generateRouteOnly (route + empty day stubs, no activities)
// ============================================================

/**
 * Build a single-city route skeleton entirely from known trip data.
 * No Claude call needed — the route is a single city with all data already
 * provided by the frontend (lat/lng/countryCode/destination).
 */
export function buildSingleCityRouteOnly(tripIntent: TripIntent): Itinerary {
  const {
    destination,
    destinationCountry,
    destinationLat,
    destinationLng,
    destinationCountryCode,
    dateStart,
    dateEnd,
  } = tripIntent;

  const durationDays = dateStart && dateEnd ? daysBetween(dateStart, dateEnd) : 7;
  const cityId = (destination ?? "city").toLowerCase().replace(/\s+/g, "-");

  const route: CityStop[] = [
    {
      id: cityId,
      city: destination ?? "",
      country: destinationCountry ?? "",
      lat: destinationLat ?? 0,
      lng: destinationLng ?? 0,
      days: durationDays,
      countryCode: destinationCountryCode ?? "",
    },
  ];

  const days: TripDay[] = Array.from({ length: durationDays }, (_, i) => ({
    day: i + 1,
    date: dateStart ? formatDateShort(addDays(dateStart, i)) : `Day ${i + 1}`,
    city: destination ?? "",
    isTravel: false as const,
    activities: [],
  }));

  return { route, days };
}

/**
 * Generate only the route and day stubs (empty activities).
 * Much faster/cheaper than full generation — activities are added per-city later.
 * For single-city trips, skips the Claude call entirely and builds the skeleton
 * programmatically from the known trip data.
 */
export async function generateRouteOnly(
  profile: UserProfile,
  tripIntent: TripIntent,
  preSelectedCities?: CityWithDays[],
  options?: { signal?: AbortSignal }
): Promise<Itinerary> {
  if (tripIntent.tripType === "single-city") {
    log.info("Route-only: Single-city — building skeleton without Claude", {
      tripId: tripIntent.id,
      destination: tripIntent.destination,
    });
    return buildSingleCityRouteOnly(tripIntent);
  }

  return generateWithConfig(
    ROUTE_ONLY_PROMPT_CONFIG,
    profile,
    tripIntent,
    preSelectedCities,
    options?.signal
  );
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

  const maxTokens = MAX_TOKENS_CITY_ACTIVITIES;

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
    const { getPrisma } = await import("@/lib/core/prisma");
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
