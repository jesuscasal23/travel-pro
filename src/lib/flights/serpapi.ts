// ============================================================
// Travel Pro — SerpApi Google Flights Client
//
// Uses Google Flights data via SerpApi for accurate consumer-facing
// prices. Booking links remain Skyscanner affiliate links.
// Docs: https://serpapi.com/google-flights-api
// ============================================================

import { Redis } from "@upstash/redis";
import type { FlightOption, FlightSearchResult, FlightLegResults } from "./types";
import { buildFlightLink } from "@/lib/affiliate/link-generator";
import { getErrorMessage } from "@/lib/utils/error";
import { createLogger } from "@/lib/core/logger";
import { getOptionalRedisEnv } from "@/lib/config/server-env";
import { SERPAPI_REQUEST_TIMEOUT_MS } from "@/lib/config/constants";
import { formatDuration } from "@/lib/utils/format/duration";

const log = createLogger("serpapi");

const SERPAPI_BASE = "https://serpapi.com/search";

export class SerpApiRateLimitError extends Error {
  constructor() {
    super("Flight search is busy — please try again in a moment.");
    this.name = "SerpApiRateLimitError";
  }
}

// ── Redis (shared lazy-init pattern) ────────────────────────

let _redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const redisEnv = getOptionalRedisEnv();
  if (!redisEnv) {
    _redis = null;
    return null;
  }
  _redis = new Redis(redisEnv);
  return _redis;
}

async function safeRedisGet<T>(redis: Redis, key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (e) {
    log.warn("Redis get failed, skipping cache", { key, error: getErrorMessage(e) });
    return null;
  }
}

async function safeRedisSet(redis: Redis, key: string, ttl: number, value: unknown): Promise<void> {
  try {
    await redis.setex(key, ttl, value);
  } catch (e) {
    log.warn("Redis set failed, skipping cache", { key, error: getErrorMessage(e) });
  }
}

// ── SerpApi Types ───────────────────────────────────────────

interface SerpApiFlight {
  departure_airport: { id: string; name: string; time: string };
  arrival_airport: { id: string; name: string; time: string };
  duration: number; // minutes
  airline: string;
  airline_logo: string;
  flight_number: string;
  travel_class: string;
}

interface SerpApiItinerary {
  flights: SerpApiFlight[];
  layovers?: Array<{ duration: number; name: string; id: string }>;
  total_duration: number; // minutes
  price: number;
  type: string;
  airline_logo: string;
  booking_token?: string;
}

interface SerpApiResponse {
  search_metadata: { status: string };
  best_flights?: SerpApiItinerary[];
  other_flights?: SerpApiItinerary[];
  error?: string;
}

// ── Helpers ─────────────────────────────────────────────────

/** Extract IATA airline code from flight number like "DL 123" → "DL". */
function extractAirlineCode(flightNumber: string): string {
  const match = flightNumber.match(/^([A-Z0-9]{2})/);
  return match ? match[1] : "?";
}

/** Map SerpApi travel_class to Amadeus-style cabin string. */
function normalizeCabin(travelClass: string): string {
  const upper = travelClass.toUpperCase();
  if (upper.includes("BUSINESS")) return "BUSINESS";
  if (upper.includes("FIRST")) return "FIRST";
  if (upper.includes("PREMIUM")) return "PREMIUM_ECONOMY";
  return "ECONOMY";
}

/** Map stops filter to SerpApi stops param. */
function mapStopsFilter(nonStop?: boolean): string | undefined {
  if (nonStop) return "1"; // nonstop only
  return undefined;
}

// ── Main Search Functions ───────────────────────────────────

/**
 * Search for the cheapest flight between two IATA codes on a given date.
 * Returns null when SerpApi is not configured, unavailable, or no flights found.
 * Results are cached in Redis for 2 hours.
 */
export async function searchFlights(
  apiKey: string,
  origin: string,
  destination: string,
  date: string,
  adults: number,
  signal?: AbortSignal
): Promise<FlightOption | null> {
  const redis = getRedis();
  const cacheKey = `serpapi:flights:${origin}:${destination}:${date}:${adults}`;
  if (redis) {
    const cached = await safeRedisGet<FlightOption>(redis, cacheKey);
    if (cached) return cached;
  }

  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    departure_id: origin,
    arrival_id: destination,
    outbound_date: date,
    type: "2", // one-way
    adults: String(adults),
    currency: "EUR",
    sort_by: "2", // by price
    hl: "en",
  });

  let res: Response;
  try {
    res = await fetch(`${SERPAPI_BASE}?${params}`, {
      signal: AbortSignal.any([
        AbortSignal.timeout(SERPAPI_REQUEST_TIMEOUT_MS),
        ...(signal ? [signal] : []),
      ]),
    });
  } catch (e) {
    log.warn("Network error", { error: getErrorMessage(e) });
    return null;
  }

  if (res.status === 429) {
    log.warn("SerpApi rate limit hit", { origin, destination, date });
    return null;
  }

  if (!res.ok) {
    log.warn("SerpApi search failed", { origin, destination, date, status: res.status });
    return null;
  }

  const body = (await res.json()) as SerpApiResponse;
  const allFlights = [...(body.best_flights ?? []), ...(body.other_flights ?? [])];
  if (allFlights.length === 0) return null;

  // Sort by price and take cheapest
  allFlights.sort((a, b) => a.price - b.price);
  const best = allFlights[0];
  const firstFlight = best.flights[0];

  const option: FlightOption = {
    price: best.price * adults, // SerpApi returns per-person price
    duration: formatDuration(best.total_duration),
    airline: extractAirlineCode(firstFlight?.flight_number ?? ""),
  };

  if (redis) await safeRedisSet(redis, cacheKey, 7200, option);
  return option;
}

/**
 * Search for up to 10 flight options between two IATA codes on a given date.
 * Returns [] when SerpApi is not configured, unavailable, or no flights found.
 * Results are cached in Redis for 2 hours.
 */
export async function searchFlightsMulti(
  apiKey: string,
  origin: string,
  destination: string,
  date: string,
  adults: number,
  filters?: { nonStop?: boolean; maxPrice?: number },
  signal?: AbortSignal
): Promise<FlightSearchResult[]> {
  const redis = getRedis();
  const filterSuffix = [
    filters?.nonStop ? "nonstop" : "",
    filters?.maxPrice ? `max${filters.maxPrice}` : "",
  ]
    .filter(Boolean)
    .join(":");
  const cacheKey = `serpapi:flights:multi:${origin}:${destination}:${date}:${adults}${filterSuffix ? `:${filterSuffix}` : ""}`;

  if (redis) {
    const cached = await safeRedisGet<FlightSearchResult[]>(redis, cacheKey);
    if (cached) return cached;
  }

  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    departure_id: origin,
    arrival_id: destination,
    outbound_date: date,
    type: "2", // one-way
    adults: String(adults),
    currency: "EUR",
    sort_by: "2", // by price
    hl: "en",
  });

  const stopsParam = mapStopsFilter(filters?.nonStop);
  if (stopsParam) params.set("stops", stopsParam);
  if (filters?.maxPrice) params.set("max_price", String(filters.maxPrice));

  let res: Response;
  try {
    res = await fetch(`${SERPAPI_BASE}?${params}`, {
      signal: AbortSignal.any([
        AbortSignal.timeout(SERPAPI_REQUEST_TIMEOUT_MS),
        ...(signal ? [signal] : []),
      ]),
    });
  } catch (e) {
    log.warn("Network error", { error: getErrorMessage(e) });
    return [];
  }

  if (res.status === 429) {
    log.warn("SerpApi rate limit hit", { origin, destination, date });
    throw new SerpApiRateLimitError();
  }

  if (!res.ok) {
    log.warn("SerpApi search failed", { origin, destination, date, status: res.status });
    return [];
  }

  const body = (await res.json()) as SerpApiResponse;
  if (body.error) {
    log.warn("SerpApi returned error", { error: body.error, origin, destination, date });
    return [];
  }

  const allFlights = [...(body.best_flights ?? []), ...(body.other_flights ?? [])];
  if (allFlights.length === 0) return [];

  // Skyscanner affiliate link as fallback when no booking_token
  const fallbackUrl = buildFlightLink(
    { fromIata: origin, toIata: destination, departureDate: date },
    adults
  );

  const results: FlightSearchResult[] = allFlights.map((itinerary) => {
    const segments = itinerary.flights;
    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];
    const cabin = normalizeCabin(firstSeg?.travel_class ?? "Economy");

    return {
      price: itinerary.price * adults, // SerpApi returns per-person price
      duration: formatDuration(itinerary.total_duration),
      airline: extractAirlineCode(firstSeg?.flight_number ?? ""),
      stops: Math.max(0, segments.length - 1),
      departureTime: firstSeg?.departure_airport?.time ?? "",
      arrivalTime: lastSeg?.arrival_airport?.time ?? "",
      cabin,
      bookingUrl: fallbackUrl,
      bookingToken: itinerary.booking_token,
    };
  });

  // Sort by price ascending
  results.sort((a, b) => a.price - b.price);

  // Limit to 10 results
  const trimmed = results.slice(0, 10);

  if (redis) await safeRedisSet(redis, cacheKey, 7200, trimmed);
  return trimmed;
}

/**
 * Pre-fetch flight options for all legs in parallel.
 * Failed legs get empty results — never throws.
 */
export async function prefetchFlightOptions(
  apiKey: string,
  legs: Array<{ fromIata: string; toIata: string; departureDate: string }>,
  travelers: number,
  signal?: AbortSignal
): Promise<FlightLegResults[]> {
  const settled = await Promise.allSettled(
    legs.map((leg) =>
      searchFlightsMulti(
        apiKey,
        leg.fromIata,
        leg.toIata,
        leg.departureDate,
        travelers,
        undefined,
        signal
      )
    )
  );

  return legs.map((leg, i) => ({
    fromIata: leg.fromIata,
    toIata: leg.toIata,
    departureDate: leg.departureDate,
    results: settled[i].status === "fulfilled" ? settled[i].value : [],
    fetchedAt: Date.now(),
  }));
}

// ── Booking URL Resolution ──────────────────────────────────

interface SerpApiBookingOption {
  together?: {
    book_with?: string;
    price?: number;
    booking_request?: {
      url: string;
      post_data?: string;
    };
  };
}

interface SerpApiBookingResponse {
  booking_options?: SerpApiBookingOption[];
  error?: string;
}

/**
 * Resolve a booking_token into an actual airline/OTA booking URL.
 *
 * 1. Calls SerpApi with the booking_token to get booking_options
 * 2. Picks the first option's booking_request
 * 3. POSTs to Google's click-tracking endpoint to resolve the final URL
 * 4. Returns the redirect location (the real booking page)
 */
export async function resolveBookingUrl(
  apiKey: string,
  bookingToken: string
): Promise<string | null> {
  // Step 1: Get booking options from SerpApi
  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    booking_token: bookingToken,
    hl: "en",
    currency: "EUR",
  });

  let res: Response;
  try {
    res = await fetch(`${SERPAPI_BASE}?${params}`, {
      signal: AbortSignal.timeout(SERPAPI_REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    log.warn("Booking options network error", { error: getErrorMessage(e) });
    return null;
  }

  if (res.status === 429) {
    log.warn("SerpApi rate limit hit during booking resolution");
    throw new SerpApiRateLimitError();
  }

  if (!res.ok) {
    log.warn("SerpApi booking options failed", { status: res.status });
    return null;
  }

  const body = (await res.json()) as SerpApiBookingResponse;
  if (body.error) {
    log.warn("SerpApi booking options error", { error: body.error });
    return null;
  }

  const options = body.booking_options ?? [];
  if (options.length === 0) {
    log.warn("No booking options returned");
    return null;
  }

  // Pick the first booking option
  const bookingRequest = options[0].together?.booking_request;
  if (!bookingRequest?.url) {
    log.warn("No booking_request in first option");
    return null;
  }

  // Step 2: POST to Google's click-tracking endpoint to get the final redirect
  try {
    const postRes = await fetch(bookingRequest.url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bookingRequest.post_data ?? "",
      redirect: "manual", // Don't follow — we want the Location header
      signal: AbortSignal.timeout(10_000),
    });

    const location = postRes.headers.get("location");
    if (location && /^https?:\/\//i.test(location)) {
      return location;
    }

    // Some responses use meta-refresh or JS redirect — try reading body
    if (postRes.status >= 200 && postRes.status < 400) {
      const html = await postRes.text();
      const metaMatch = html.match(/url=["']?([^"'\s>]+)/i);
      if (metaMatch?.[1] && /^https?:\/\//i.test(metaMatch[1])) {
        return metaMatch[1];
      }
    }

    log.warn("No redirect location from Google click endpoint", {
      status: postRes.status,
    });
    return null;
  } catch (e) {
    log.warn("Failed to resolve booking redirect", { error: getErrorMessage(e) });
    return null;
  }
}
