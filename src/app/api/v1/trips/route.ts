// ============================================================
// Travel Pro — GET/POST /api/v1/trips
// List user trips / create new trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import {
  apiHandler,
  parseAndValidateRequest,
  requireAuth,
} from "@/lib/api/helpers";
import { createGuestTripOwnerCookie } from "@/lib/api/guest-trip-ownership";
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
  return NextResponse.json({ trips });
});

export const POST = apiHandler("POST /api/v1/trips", async (req: NextRequest) => {
  const data = await parseAndValidateRequest(req, CreateTripInputSchema);

  // Auto-set profileId from auth session (null for anonymous users)
  let profileId: string | null = null;
  const userId = await getAuthenticatedUserId();
  if (userId) {
    const profile = await findProfileByUserId(userId);
    profileId = profile?.id ?? null;
  }

  const trip = await createTrip(data, profileId);

  const response = NextResponse.json({ trip }, { status: 201 });
  if (!trip.profileId) {
    response.cookies.set(createGuestTripOwnerCookie(trip.id));
  }

  return response;
});
