// ============================================================
// Travel Pro — GET /api/v1/trips/[id]/share
// Generate (or return existing) share token for a trip
// ============================================================
import { NextResponse } from "next/server";
import { apiHandler, requireAuth, requireProfile, requireUserTripOwner } from "@/lib/api/helpers";
import {
  getOrCreateTripShareToken,
  serializeTripShareToken,
} from "@/lib/features/trips/trip-share-service";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/trips/:id/share", async (_req, params) => {
  const userId = await requireAuth();
  const profile = await requireProfile(userId);
  await requireUserTripOwner(params.id, profile.id);

  return NextResponse.json(serializeTripShareToken(await getOrCreateTripShareToken(params.id)));
});
