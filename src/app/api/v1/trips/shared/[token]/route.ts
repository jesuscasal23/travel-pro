// ============================================================
// Travel Pro — GET /api/v1/trips/shared/[token]
// Public endpoint — returns a shared trip + active itinerary (no auth required)
// Rate limiting is handled by middleware (Upstash Redis sliding window, 60 req/min)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ACTIVE_ITINERARY_INCLUDE } from "@/lib/api/helpers";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/v1/trips/shared");

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params;

  try {
    const trip = await prisma.trip.findFirst({
      where: { shareToken: token },
      include: ACTIVE_ITINERARY_INCLUDE,
    });

    if (!trip || trip.itineraries.length === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Return only the public fields (no profile/user data)
    return NextResponse.json({
      trip: {
        id: trip.id,
        region: trip.region,
        dateStart: trip.dateStart,
        dateEnd: trip.dateEnd,
        travelers: trip.travelers,
      },
      itinerary: trip.itineraries[0].data,
    });
  } catch (err) {
    log.error("Failed to load shared trip", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Failed to load trip" }, { status: 500 });
  }
}
