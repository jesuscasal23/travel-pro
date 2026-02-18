// ============================================================
// Travel Pro — GET/PATCH/DELETE /api/v1/trips/[id]
// Fetch, update, or delete a specific trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const EditItinerarySchema = z.object({
  editType: z.enum(["adjust_days", "remove_city", "reorder_cities", "add_city", "regenerate_activities"]),
  editPayload: z.record(z.string(), z.unknown()),
  description: z.string().optional(),
  data: z.unknown().optional(), // Updated itinerary data
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        itineraries: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (err) {
    console.error("[GET /api/v1/trips/:id]", err);
    return NextResponse.json({ error: "Failed to fetch trip" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EditItinerarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid edit data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { editType, editPayload, description, data } = parsed.data;

  try {
    // Find the current active itinerary
    const currentItinerary = await prisma.itinerary.findFirst({
      where: { tripId: id, isActive: true },
      orderBy: { version: "desc" },
    });

    if (!currentItinerary) {
      return NextResponse.json({ error: "No active itinerary found" }, { status: 404 });
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
      // Deactivate current version
      await prisma.itinerary.update({
        where: { id: currentItinerary.id },
        data: { isActive: false },
      });

      // Create new version
      const newItinerary = await prisma.itinerary.create({
        data: {
          tripId: id,
          data: data as object,
          version: currentItinerary.version + 1,
          isActive: true,
          promptVersion: currentItinerary.promptVersion,
          generationStatus: "complete",
        },
      });

      return NextResponse.json({ itinerary: newItinerary });
    }

    return NextResponse.json({ success: true, editLogged: true });
  } catch (err) {
    console.error("[PATCH /api/v1/trips/:id]", err);
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.trip.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/v1/trips/:id]", err);
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }
}
