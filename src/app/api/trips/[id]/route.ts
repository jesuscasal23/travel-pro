// ============================================================
// Travel Pro — GET/PUT/DELETE /api/trips/[id]
//
// GET    — Fetch a single trip by ID (with itinerary)
// PUT    — Upsert itinerary data for a trip
// DELETE — Delete a trip and its itinerary
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// ── Zod schema for PUT body ─────────────────────────────────────────────────

const UpdateItinerarySchema = z.object({
  itineraryData: z.any(),
});

// ── GET /api/trips/[id] ─────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const trip = await getPrisma().trip.findUnique({
      where: { id },
      include: { itinerary: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error(`[GET /api/trips/${id}] Error:`, error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to fetch trip" },
      { status: 500 }
    );
  }
}

// ── PUT /api/trips/[id] ─────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body — expected JSON" },
      { status: 400 }
    );
  }

  const parsed = UpdateItinerarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { itineraryData } = parsed.data;

  try {
    // Verify the trip exists
    const trip = await getPrisma().trip.findUnique({ where: { id } });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Upsert the itinerary
    const itinerary = await getPrisma().itinerary.upsert({
      where: { tripId: id },
      create: { tripId: id, data: itineraryData },
      update: { data: itineraryData },
    });

    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error(`[PUT /api/trips/${id}] Error:`, error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to update itinerary" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/trips/[id] ──────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verify the trip exists
    const trip = await getPrisma().trip.findUnique({ where: { id } });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Delete itinerary first (if exists), then delete the trip
    await getPrisma().itinerary.deleteMany({ where: { tripId: id } });
    await getPrisma().trip.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/trips/${id}] Error:`, error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to delete trip" },
      { status: 500 }
    );
  }
}
