// ============================================================
// Fichi — Flight Module Facade
//
// Consolidated entry point for all flight operations.
// Hides SerpApi details, env checking, IATA resolution,
// route-to-legs conversion, and timeout logic.
// ============================================================

import { ApiError, BadRequestError, UpstreamServiceError } from "@/lib/api/errors";
import { abortableDelay } from "@/lib/core/abort";
import { createLogger } from "@/lib/core/logger";
import { OPTIMIZE_FLIGHTS_TIMEOUT_MS } from "@/lib/config/constants";
import { getOptionalSerpApiEnv } from "@/lib/config/server-env";
import {
  SerpApiRateLimitError,
  searchFlights as serpApiSearchFlights,
  searchFlightsMulti,
  getBookingRequest,
} from "./serpapi";
import { resolveRouteIataCodes, buildOptimizerCities } from "./route-utils";
import { optimizeFlights } from "./optimizer";
import { parseIataCode } from "./iata";
import type { CityStop } from "@/types";
import type { FlightLegResults, FlightSkeleton } from "./types";

export { SerpApiRateLimitError } from "./serpapi";

const log = createLogger("flights");

// ── Entry Point 1: optimizeFlightsForTrip ───────────────────

interface OptimizeFlightsInput {
  homeAirport: string;
  route: (CityStop & { days: number })[];
  dateStart: string;
  dateEnd: string;
  travelers?: number;
}

/**
 * Run the date optimization algorithm to find the cheapest
 * day-assignment across flexible city durations.
 *
 * Throws BadRequestError for invalid input, UpstreamServiceError on failure.
 */
export async function optimizeFlightsForTrip(input: OptimizeFlightsInput): Promise<FlightSkeleton> {
  const homeIata = parseIataCode(input.homeAirport);
  if (!homeIata) {
    throw new BadRequestError("Could not parse home airport IATA code", {
      homeAirport: input.homeAirport,
    });
  }

  const { resolvedRoute, missingCities } = resolveRouteIataCodes(input.route);
  if (missingCities.length > 0) {
    throw new BadRequestError(`Could not resolve IATA codes for: ${missingCities.join(", ")}`, {
      missingCities,
    });
  }

  const totalDays = Math.round(
    (new Date(input.dateEnd).getTime() - new Date(input.dateStart).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const serpApi = getOptionalSerpApiEnv();
  const searcher = serpApi
    ? (origin: string, dest: string, date: string, travelers: number, signal?: AbortSignal) =>
        serpApiSearchFlights(serpApi.apiKey, origin, dest, date, travelers, signal)
    : () => Promise.resolve(null);

  try {
    const result = await Promise.race([
      optimizeFlights(
        homeIata,
        buildOptimizerCities(resolvedRoute),
        input.dateStart,
        totalDays,
        input.travelers ?? 1,
        searcher
      ),
      abortableDelay(OPTIMIZE_FLIGHTS_TIMEOUT_MS).then(() => {
        throw new UpstreamServiceError("Flight optimization timed out");
      }),
    ]);
    return result;
  } catch (err) {
    if (err instanceof UpstreamServiceError) throw err;
    throw new UpstreamServiceError(
      "Flight optimization failed — SerpApi may not be configured or available"
    );
  }
}

// ── Entry Point 2: searchFlightLeg ──────────────────────────

interface SearchFlightLegInput {
  fromIata: string;
  toIata: string;
  departureDate: string;
  travelers: number;
  nonStop?: boolean;
  maxPrice?: number;
}

/**
 * Search for up to 10 flight options on a single leg.
 * Returns a FlightLegResults with results array (possibly empty).
 *
 * Throws ApiError(429) on SerpApi rate limit.
 */
export async function searchFlightLeg(input: SearchFlightLegInput): Promise<FlightLegResults> {
  const filters =
    input.nonStop || input.maxPrice
      ? { nonStop: input.nonStop, maxPrice: input.maxPrice }
      : undefined;

  const serpApi = getOptionalSerpApiEnv();

  if (!serpApi) {
    log.warn("SerpApi not configured — returning empty flight results", {
      from: input.fromIata,
      to: input.toIata,
      date: input.departureDate,
    });
    return {
      fromIata: input.fromIata,
      toIata: input.toIata,
      departureDate: input.departureDate,
      results: [],
      fetchedAt: Date.now(),
    };
  }

  try {
    log.info("Using SerpApi Google Flights", {
      from: input.fromIata,
      to: input.toIata,
      date: input.departureDate,
    });
    const results = await searchFlightsMulti(
      serpApi.apiKey,
      input.fromIata,
      input.toIata,
      input.departureDate,
      input.travelers,
      filters
    );

    return {
      fromIata: input.fromIata,
      toIata: input.toIata,
      departureDate: input.departureDate,
      results,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof SerpApiRateLimitError) {
      throw new ApiError(429, error.message, { provider: "serpapi" }, "serpapi_rate_limit");
    }
    throw error;
  }
}

// ── Entry Point 3: resolveBooking ───────────────────────────

interface ResolveBookingInput {
  bookingToken: string;
  departureId: string;
  arrivalId: string;
  outboundDate: string;
}

/**
 * Resolve a SerpApi booking token to a BookingRequest.
 * Returns null when SerpApi is not configured or the token cannot be resolved.
 * Throws SerpApiRateLimitError on rate limit (callers handle display).
 */
export async function resolveBooking(input: ResolveBookingInput) {
  const serpApi = getOptionalSerpApiEnv();
  if (!serpApi) return null;

  return getBookingRequest(serpApi.apiKey, input.bookingToken, {
    departureId: input.departureId,
    arrivalId: input.arrivalId,
    outboundDate: input.outboundDate,
  });
}
