// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/flights
// On-demand flight search returning up to 5 options per leg
// ============================================================
import { NextResponse } from "next/server";
import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { FlightSearchInputSchema } from "@/lib/features/trips/schemas";
import { searchTripFlights } from "@/lib/features/trips/flight-search-service";

export const dynamic = "force-dynamic";

export const POST = apiHandler("POST /api/v1/trips/:id/flights", async (req, params) => {
  await assertTripAccess(req, params.id, {
    allowGuestId: true,
    requireTripOwner: true,
  });

  const { fromIata, toIata, departureDate, travelers, nonStop, maxPrice } =
    await parseAndValidateRequest(req, FlightSearchInputSchema);

  return NextResponse.json(
    await searchTripFlights({ fromIata, toIata, departureDate, travelers, nonStop, maxPrice })
  );
});
