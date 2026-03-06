// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/flights
// On-demand flight search returning up to 5 options per leg
// ============================================================
import { NextResponse } from "next/server";
import { apiHandler, ApiError, parseJsonBody, validateBody } from "@/lib/api/helpers";
import { FlightSearchInputSchema } from "@/lib/api/schemas";
import { searchFlightsMulti } from "@/lib/flights/amadeus";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export const POST = apiHandler("POST /api/v1/trips/:id/flights", async (req, params) => {
  // Guest trips skip DB check — flight search only needs IATA codes
  if (params.id !== "guest") {
    const trip = await prisma.trip.findUnique({ where: { id: params.id } });
    if (!trip) throw new ApiError(404, "Trip not found");
  }

  const body = await parseJsonBody(req);
  const { fromIata, toIata, departureDate, travelers } = validateBody(
    FlightSearchInputSchema,
    body
  );

  const results = await searchFlightsMulti(fromIata, toIata, departureDate, travelers);

  return NextResponse.json({
    fromIata,
    toIata,
    departureDate,
    results,
    fetchedAt: Date.now(),
  });
});
