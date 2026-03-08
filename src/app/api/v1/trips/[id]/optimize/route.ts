import { NextResponse } from "next/server";
import { optimizeFlights } from "@/lib/flights/optimizer";
import { parseIataCode } from "@/lib/affiliate/link-generator";
import { lookupIata } from "@/lib/flights/city-iata-map";
import {
  apiHandler,
  ApiError,
  assertTripAccess,
  parseJsonBody,
  validateBody,
} from "@/lib/api/helpers";
import { OptimizeTripInputSchema } from "@/lib/api/schemas";
import type { CityStop } from "@/types";
import type { CityWithDays } from "@/lib/flights/types";

/**
 * POST /api/v1/trips/[id]/optimize
 *
 * Runs Amadeus flight price optimization on demand.
 * Accepts the current itinerary route and trip dates; returns a FlightSkeleton
 * with per-leg real prices and a baseline (average) for savings display.
 *
 * The client is responsible for persisting the result via setItinerary().
 */
export const POST = apiHandler("POST /api/v1/trips/:id/optimize", async (req, params) => {
  await assertTripAccess(params.id, { requireOwnershipForUserTrips: true });

  const body = await parseJsonBody(req);
  const { homeAirport, route, dateStart, dateEnd, travelers } = validateBody(
    OptimizeTripInputSchema,
    body
  );

  const homeIata = parseIataCode(homeAirport);
  if (!homeIata) {
    throw new ApiError(400, "Could not parse home airport IATA code");
  }

  // Fill in any missing IATA codes from the static city lookup table
  // (fallback for demo data and trips where Stage A didn't run)
  const resolvedRoute: (CityStop & { iataCode: string })[] = [];
  const stillMissing: string[] = [];
  for (const stop of route) {
    const iata = stop.iataCode ?? lookupIata(stop.city);
    if (iata) {
      resolvedRoute.push({ ...stop, iataCode: iata });
    } else {
      stillMissing.push(stop.city);
    }
  }

  if (stillMissing.length > 0) {
    throw new ApiError(400, `Could not resolve IATA codes for: ${stillMissing.join(", ")}`);
  }

  const totalDays = Math.round(
    (new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Give each city ±1 day of flexibility so the optimizer can find cheaper dates
  const cities: CityWithDays[] = resolvedRoute.map((stop) => ({
    id: stop.id,
    city: stop.city,
    country: stop.country,
    countryCode: stop.countryCode,
    iataCode: stop.iataCode,
    lat: stop.lat,
    lng: stop.lng,
    minDays: Math.max(1, stop.days - 1),
    maxDays: stop.days + 1,
  }));

  try {
    const skeleton = await optimizeFlights(homeIata, cities, dateStart, totalDays, travelers ?? 1);

    return NextResponse.json({ skeleton });
  } catch {
    throw new ApiError(
      502,
      "Flight optimization failed — Amadeus may not be configured or available"
    );
  }
});
