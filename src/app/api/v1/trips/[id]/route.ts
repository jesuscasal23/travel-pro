// ============================================================
// Travel Pro — GET/PATCH/DELETE /api/v1/trips/[id]
// Fetch, update, or delete a specific trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  apiHandler,
  ApiError,
  requireAuth,
  requireProfile,
  requireTripOwnership,
  parseJsonBody,
  validateBody,
  ACTIVE_ITINERARY_INCLUDE,
} from "@/lib/api/helpers";
import { findActiveItinerary, createItineraryVersion } from "@/lib/services/itinerary-service";
import type { Itinerary } from "@/types";

export const dynamic = "force-dynamic";

const EditItinerarySchema = z.object({
  editType: z.enum(["adjust_days", "remove_city", "reorder_cities", "add_city", "regenerate_activities"]),
  editPayload: z.record(z.string(), z.unknown()),
  description: z.string().optional(),
  data: z.unknown().optional(), // Updated itinerary data
});

export const GET = apiHandler("GET /api/v1/trips/:id", async (_req: NextRequest, params) => {
  const trip = await prisma.trip.findUnique({
    where: { id: params.id },
    include: ACTIVE_ITINERARY_INCLUDE,
  });

  if (!trip) {
    throw new ApiError(404, "Trip not found");
  }

  return NextResponse.json({ trip });
});

export const PATCH = apiHandler("PATCH /api/v1/trips/:id", async (req: NextRequest, params) => {
  const userId = await requireAuth();
  const profile = await requireProfile(userId);
  await requireTripOwnership(params.id, profile.id);

  const body = await parseJsonBody(req);
  const { editType, editPayload, description, data } = validateBody(EditItinerarySchema, body);

  // Find the current active itinerary
  const currentItinerary = await findActiveItinerary(params.id);
  if (!currentItinerary) {
    throw new ApiError(404, "No active itinerary found");
  }

  // Log the edit
  await prisma.itineraryEdit.create({
    data: {
      itineraryId: currentItinerary.id,
      editType,
      editPayload: editPayload as object,
      description,
    },
  });

  // If new data is provided, create a new version
  if (data) {
    const newItinerary = await createItineraryVersion({
      tripId: params.id,
      data: data as Itinerary,
      promptVersion: currentItinerary.promptVersion,
      previousItineraryId: currentItinerary.id,
      previousVersion: currentItinerary.version,
    });

    return NextResponse.json({ itinerary: newItinerary });
  }

  return NextResponse.json({ success: true, editLogged: true });
});

export const DELETE = apiHandler("DELETE /api/v1/trips/:id", async (_req: NextRequest, params) => {
  const userId = await requireAuth();
  const profile = await requireProfile(userId);
  await requireTripOwnership(params.id, profile.id);

  await prisma.trip.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
});
