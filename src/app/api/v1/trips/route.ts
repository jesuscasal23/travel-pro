// ============================================================
// Travel Pro — GET/POST /api/v1/trips
// List user trips / create new trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const CreateTripSchema = z.object({
  profileId: z.string().optional(),
  region: z.string().min(1).max(100),
  dateStart: z.string().max(20),
  dateEnd: z.string().max(20),
  flexibleDates: z.boolean().default(false),
  budget: z.number().positive().max(1_000_000),
  vibe: z.enum(["relaxation", "adventure", "cultural", "mix"]),
  travelers: z.number().int().min(1).max(20).default(2),
});

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId");

  try {
    const trips = await prisma.trip.findMany({
      where: profileId ? { profileId } : undefined,
      include: {
        itineraries: {
          where: { isActive: true },
          select: { id: true, version: true, generationStatus: true, createdAt: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ trips });
  } catch (err) {
    console.error("[GET /api/v1/trips]", err);
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid trip data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const trip = await prisma.trip.create({ data: parsed.data });
    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/trips]", err);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}
