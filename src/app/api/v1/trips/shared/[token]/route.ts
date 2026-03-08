// ============================================================
// Travel Pro — GET /api/v1/trips/shared/[token]
// Public endpoint — returns a shared trip + active itinerary (no auth required)
// Rate limiting is handled by middleware (Upstash Redis sliding window, 60 req/min)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/helpers";
import { loadSharedTripContext } from "@/lib/features/trips/trip-query-service";
import { serializeSharedTrip } from "@/lib/features/trips/trip-serializer";

export const dynamic = "force-dynamic";

export const GET = apiHandler(
  "GET /api/v1/trips/shared/:token",
  async (_req: NextRequest, params) => {
    const { trip } = await loadSharedTripContext(params.token);
    return NextResponse.json(serializeSharedTrip(trip));
  }
);
