// ============================================================
// Travel Pro — SerpApi Google Flights Client
//
// Uses Google Flights data via SerpApi for accurate consumer-facing
// prices. Booking links remain Skyscanner affiliate links.
// Docs: https://serpapi.com/google-flights-api
// ============================================================

import type { FlightOption, FlightSearchResult, FlightLegResults } from "./types";
import { buildFlightLink } from "@/lib/features/affiliate/link-generator";
import { getErrorMessage } from "@/lib/utils/error";
import { createLogger } from "@/lib/core/logger";
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
 */
export async function searchFlights(
  apiKey: string,
  origin: string,
  destination: string,
  date: string,
  adults: number,
  signal?: AbortSignal
): Promise<FlightOption | null> {
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

  return {
    price: best.price * adults, // SerpApi returns per-person price
    duration: formatDuration(best.total_duration),
    airline: extractAirlineCode(firstFlight?.flight_number ?? ""),
  };
}

/**
 * Search for up to 10 flight options between two IATA codes on a given date.
 * Returns [] when SerpApi is not configured, unavailable, or no flights found.
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

  // Track booking token availability
  const withToken = results.filter((r) => r.bookingToken).length;
  const without = results.length - withToken;
  if (without > 0) {
    log.warn("Missing booking_token from SerpApi", {
      origin,
      destination,
      date,
      total: results.length,
      withToken,
      withoutToken: without,
    });
  }

  // Sort by price ascending
  results.sort((a, b) => a.price - b.price);

  // Limit to 10 results
  return results.slice(0, 10);
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
  bookingToken: string,
  flight: { departureId: string; arrivalId: string; outboundDate: string }
): Promise<string | null> {
  // Step 1: Get booking options from SerpApi
  // SerpApi requires departure_id, arrival_id, outbound_date and type alongside the booking_token
  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    booking_token: bookingToken,
    departure_id: flight.departureId,
    arrival_id: flight.arrivalId,
    outbound_date: flight.outboundDate,
    type: "2", // one-way
    hl: "en",
    currency: "EUR",
  });

  log.info("Resolving booking URL", {
    tokenPrefix: bookingToken.slice(0, 40) + "…",
    tokenLength: bookingToken.length,
    departureId: flight.departureId,
    arrivalId: flight.arrivalId,
    outboundDate: flight.outboundDate,
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
    const errorBody = await res.text().catch(() => "(unreadable)");
    log.warn("SerpApi booking options failed", {
      status: res.status,
      body: errorBody.slice(0, 500),
    });
    return null;
  }

  const body = (await res.json()) as SerpApiBookingResponse;

  // Log the full response shape to diagnose missing fields
  log.info("SerpApi booking response", {
    hasError: !!body.error,
    error: body.error ?? null,
    optionsCount: body.booking_options?.length ?? 0,
    topLevelKeys: Object.keys(body).join(", "),
    firstOption: body.booking_options?.[0]
      ? {
          hasTogetherKey: !!body.booking_options[0].together,
          togetherKeys: body.booking_options[0].together
            ? Object.keys(body.booking_options[0].together).join(", ")
            : null,
          hasBookingRequest: !!body.booking_options[0].together?.booking_request,
          bookWith: body.booking_options[0].together?.book_with ?? null,
          requestUrl: body.booking_options[0].together?.booking_request?.url?.slice(0, 120) ?? null,
          hasPostData: !!body.booking_options[0].together?.booking_request?.post_data,
        }
      : null,
  });

  if (body.error) {
    log.warn("SerpApi booking options error", { error: body.error });
    return null;
  }

  const options = body.booking_options ?? [];
  if (options.length === 0) {
    log.warn("No booking options returned", { responseKeys: Object.keys(body).join(", ") });
    return null;
  }

  // Pick the first booking option
  const bookingRequest = options[0].together?.booking_request;
  if (!bookingRequest?.url) {
    log.warn("No booking_request in first option", {
      optionKeys: Object.keys(options[0]).join(", "),
      togetherKeys: options[0].together ? Object.keys(options[0].together).join(", ") : "N/A",
      rawFirstOption: JSON.stringify(options[0]).slice(0, 500),
    });
    return null;
  }

  // Step 2: POST to Google's click-tracking endpoint to get the final redirect
  log.info("POSTing to Google click endpoint", {
    url: bookingRequest.url.slice(0, 120),
    hasPostData: !!bookingRequest.post_data,
    postDataLength: bookingRequest.post_data?.length ?? 0,
  });

  try {
    const postRes = await fetch(bookingRequest.url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bookingRequest.post_data ?? "",
      redirect: "manual", // Don't follow — we want the Location header
      signal: AbortSignal.timeout(10_000),
    });

    const location = postRes.headers.get("location");
    log.info("Google click endpoint response", {
      status: postRes.status,
      hasLocation: !!location,
      locationPrefix: location?.slice(0, 120) ?? null,
      headers: Object.fromEntries(
        [...postRes.headers.entries()].filter(([k]) =>
          ["location", "content-type", "set-cookie"].includes(k.toLowerCase())
        )
      ),
    });

    if (location && /^https?:\/\//i.test(location)) {
      log.info("Resolved booking URL successfully", { url: location.slice(0, 120) });
      return location;
    }

    // Some responses use meta-refresh or JS redirect — try reading body
    if (postRes.status >= 200 && postRes.status < 400) {
      const html = await postRes.text();
      log.info("Google click endpoint body (no Location header)", {
        status: postRes.status,
        bodyLength: html.length,
        bodySnippet: html.slice(0, 300),
      });

      const metaMatch = html.match(/url=["']?([^"'\s>]+)/i);
      if (metaMatch?.[1] && /^https?:\/\//i.test(metaMatch[1])) {
        log.info("Resolved booking URL via meta-refresh", { url: metaMatch[1].slice(0, 120) });
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
