// ============================================================
// Travel Pro — GET/DELETE /api/v1/trips/[id]
// Fetch or delete a specific trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { apiHandler, assertTripAccess } from "@/lib/api/helpers";
import { deleteTripById } from "@/lib/features/trips/trip-collection-service";
import { loadTripWithActiveItineraries } from "@/lib/features/trips/trip-query-service";
import { serializeTrip } from "@/lib/features/trips/trip-serializer";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/trips/:id", async (_req: NextRequest, params) => {
  await assertTripAccess(_req, params.id, { requireTripOwner: true });

  return NextResponse.json({ trip: serializeTrip(await loadTripWithActiveItineraries(params.id)) });
});

export const DELETE = apiHandler("DELETE /api/v1/trips/:id", async (_req: NextRequest, params) => {
  await assertTripAccess(_req, params.id, { requireTripOwner: true });

  return NextResponse.json(await deleteTripById(params.id));
});
