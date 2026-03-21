// ============================================================
// Travel Pro — GET /api/v1/trips/[id]/booking-clicks
// Returns booking clicks for a specific trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { apiHandler, requireAuth, assertTripAccess } from "@/lib/api/helpers";
import { getBookingClicksForTrip } from "@/lib/features/affiliate/booking-click-service";

export const dynamic = "force-dynamic";

export const GET = apiHandler(
  "GET /api/v1/trips/:id/booking-clicks",
  async (req: NextRequest, params) => {
    await requireAuth();
    await assertTripAccess(req, params.id, { requireTripOwner: true });
    const clicks = await getBookingClicksForTrip(params.id);
    return NextResponse.json({ clicks });
  }
);
