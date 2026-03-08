// ============================================================
// Travel Pro — GET /api/v1/trips/shared/[token]
// Public endpoint — returns a shared trip + active itinerary (no auth required)
// Rate limiting is handled by middleware (Upstash Redis sliding window, 60 req/min)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ACTIVE_ITINERARY_INCLUDE, ApiError, apiHandler } from "@/lib/api/helpers";
import { parseItineraryData } from "@/lib/utils/trip-metadata";

export const dynamic = "force-dynamic";

export const GET = apiHandler(
  "GET /api/v1/trips/shared/:token",
  async (_req: NextRequest, params) => {
    const trip = await prisma.trip.findFirst({
      where: { shareToken: params.token },
      include: ACTIVE_ITINERARY_INCLUDE,
    });

    if (!trip || trip.itineraries.length === 0) {
      throw new ApiError(404, "Trip not found");
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
      itinerary: parseItineraryData(trip.itineraries[0].data),
    });
  }
);
