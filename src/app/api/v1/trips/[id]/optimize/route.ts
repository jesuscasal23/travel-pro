import { NextResponse } from "next/server";
import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { OptimizeTripInputSchema } from "@/lib/features/trips/schemas";
import { optimizeFlightsForTrip } from "@/lib/flights";

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
  await assertTripAccess(req, params.id, { requireTripOwner: true });

  const body = await parseAndValidateRequest(req, OptimizeTripInputSchema);
  const skeleton = await optimizeFlightsForTrip(body);

  return NextResponse.json({ skeleton });
});
