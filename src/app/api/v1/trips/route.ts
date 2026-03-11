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
  return NextResponse.json({ trips });
});

export const POST = apiHandler("POST /api/v1/trips", async (req: NextRequest) => {
  const userId = await requireAuth();
  const data = await parseAndValidateRequest(req, CreateTripInputSchema);

  let profileId: string | null = null;
  const profile = await findProfileByUserId(userId);
  profileId = profile?.id ?? null;

  const trip = await createTrip(data, profileId);
  return NextResponse.json({ trip }, { status: 201 });
});
