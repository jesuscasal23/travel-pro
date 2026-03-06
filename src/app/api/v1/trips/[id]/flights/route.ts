// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/flights
// On-demand flight search returning up to 5 options per leg
// ============================================================
import { NextResponse } from "next/server";
import { apiHandler, ApiError, parseJsonBody, validateBody } from "@/lib/api/helpers";
import { FlightSearchInputSchema } from "@/lib/api/schemas";
import { searchFlightsMulti, AmadeusRateLimitError } from "@/lib/flights/amadeus";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export const POST = apiHandler("POST /api/v1/trips/:id/flights", async (req, params) => {
  // Guest trips skip DB check — flight search only needs IATA codes
  if (params.id !== "guest") {
    const trip = await prisma.trip.findUnique({ where: { id: params.id } });
    if (!trip) throw new ApiError(404, "Trip not found");
  }

  const body = await parseJsonBody(req);
  const { fromIata, toIata, departureDate, travelers, nonStop, maxPrice } = validateBody(
    FlightSearchInputSchema,
    body
  );

  const filters = nonStop || maxPrice ? { nonStop, maxPrice } : undefined;

  let results;
  try {
    results = await searchFlightsMulti(fromIata, toIata, departureDate, travelers, filters);
  } catch (e) {
    if (e instanceof AmadeusRateLimitError) {
      return NextResponse.json({ error: e.message }, { status: 429 });
    }
    throw e;
  }

  return NextResponse.json({
    fromIata,
    toIata,
    departureDate,
    results,
    fetchedAt: Date.now(),
  });
});
