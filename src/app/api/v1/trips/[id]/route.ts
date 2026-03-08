// ============================================================
// Travel Pro — GET/PATCH/DELETE /api/v1/trips/[id]
// Fetch, update, or delete a specific trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { EditItineraryInputSchema } from "@/lib/features/generation/schemas";
import { deleteTripById } from "@/lib/features/trips/trip-collection-service";
import { loadTripWithActiveItineraries } from "@/lib/features/trips/trip-query-service";
import { serializeTrip } from "@/lib/features/trips/trip-serializer";
import { saveTripEdit } from "@/lib/features/trips/trip-edit-service";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/trips/:id", async (_req: NextRequest, params) => {
  await assertTripAccess(_req, params.id, { requireTripOwner: true });

  return NextResponse.json({ trip: serializeTrip(await loadTripWithActiveItineraries(params.id)) });
});

export const PATCH = apiHandler("PATCH /api/v1/trips/:id", async (req: NextRequest, params) => {
  await assertTripAccess(req, params.id, { requireTripOwner: true });

  const input = await parseAndValidateRequest(req, EditItineraryInputSchema);
  return NextResponse.json(await saveTripEdit({ tripId: params.id, ...input }));
});

export const DELETE = apiHandler("DELETE /api/v1/trips/:id", async (_req: NextRequest, params) => {
  await assertTripAccess(_req, params.id, { requireTripOwner: true });

  return NextResponse.json(await deleteTripById(params.id));
});
