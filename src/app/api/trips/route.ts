// ============================================================
// Travel Pro — GET/POST /api/trips
//
// GET  — List all trips with itineraries (newest first)
// POST — Create a new trip (optionally with itinerary data)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// ── Zod schema for POST body ────────────────────────────────────────────────

const CreateTripSchema = z.object({
  region: z.string().min(1).max(100),
  dateStart: z.string().min(1).max(20),
  dateEnd: z.string().min(1).max(20),
  flexibleDates: z.boolean(),
  budget: z.number().positive().max(1_000_000),
  vibe: z.string().min(1).max(50),
  travelers: z.number().int().min(1).max(20),
  itineraryData: z.any().optional(),
});

// ── GET /api/trips ──────────────────────────────────────────────────────────

export async function GET() {
  try {
    const trips = await getPrisma().trip.findMany({
      orderBy: { createdAt: "desc" },
      include: { itinerary: true },
    });

    return NextResponse.json({ trips });
  } catch (error) {
    console.error("[GET /api/trips] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}

// ── POST /api/trips ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body — expected JSON" },
      { status: 400 }
    );
  }

  const parsed = CreateTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { region, dateStart, dateEnd, flexibleDates, budget, vibe, travelers, itineraryData } =
    parsed.data;

  try {
    const trip = await getPrisma().trip.create({
      data: {
        region,
        dateStart,
        dateEnd,
        flexibleDates,
        budget,
        vibe,
        travelers,
        ...(itineraryData
          ? {
              itinerary: {
                create: {
                  data: itineraryData,
                },
              },
            }
          : {}),
      },
      include: { itinerary: true },
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/trips] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    );
  }
}
