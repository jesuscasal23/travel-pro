// ============================================================
// Travel Pro — GET/POST /api/v1/trips
// List user trips / create new trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { apiHandler, parseAndValidateRequest, requireAuth } from "@/lib/api/helpers";
import { findProfileByUserId } from "@/lib/features/profile/profile-service";
import { CreateTripInputSchema } from "@/lib/features/trips/schemas";
import { createTrip, listTripsForProfile } from "@/lib/features/trips/trip-collection-service";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/trips", async () => {
  const userId = await requireAuth();
  const profile = await findProfileByUserId(userId);
  if (!profile) {
    return NextResponse.json({ trips: [] });
  }
  const trips = await listTripsForProfile(profile.id);

  // Derive destination info from itinerary route for trips missing it (e.g. multi-city)
  const enrichedTrips = trips.map((trip) => {
    const itineraryData = trip.itineraries[0]?.data as Record<string, unknown> | undefined;
    const route = Array.isArray(itineraryData?.route) ? itineraryData.route : [];
    const firstCity = route[0] as
      | { city?: string; country?: string; countryCode?: string }
      | undefined;

    return {
      ...trip,
      destination: trip.destination ?? firstCity?.city ?? null,
      destinationCountry: trip.destinationCountry ?? firstCity?.country ?? null,
      destinationCountryCode: trip.destinationCountryCode ?? firstCity?.countryCode ?? null,
      itineraries: trip.itineraries.map(({ data: _data, ...rest }) => rest),
    };
  });

  return NextResponse.json({ trips: enrichedTrips });
});

export const POST = apiHandler("POST /api/v1/trips", async (req: NextRequest) => {
  const userId = await requireAuth();
  const data = await parseAndValidateRequest(req, CreateTripInputSchema);

  const profile = await findProfileByUserId(userId);
  const profileId = profile?.id ?? null;

  const trip = await createTrip(data, profileId);
  return NextResponse.json({ trip }, { status: 201 });
});
