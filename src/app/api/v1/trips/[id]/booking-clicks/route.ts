// ============================================================
// Fichi — GET/POST/PATCH /api/v1/trips/[id]/booking-clicks
// Returns booking clicks for a specific trip + confirm/deny booking
// + manual booking creation from preparation checklist
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  apiHandler,
  requireAuth,
  assertTripAccess,
  parseAndValidateRequest,
} from "@/lib/api/helpers";
import {
  getBookingClicksForTrip,
  confirmBookingClick,
  createManualBooking,
} from "@/lib/features/affiliate/booking-click-service";
import { getAuthenticatedUserId } from "@/lib/core/supabase-server";

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

const ManualBookingSchema = z.object({
  clickType: z.enum(["flight", "hotel"]),
  city: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = apiHandler(
  "POST /api/v1/trips/:id/booking-clicks",
  async (req: NextRequest, params) => {
    await requireAuth();
    await assertTripAccess(req, params.id, { requireTripOwner: true });
    const userId = await getAuthenticatedUserId();
    const body = await parseAndValidateRequest(req, ManualBookingSchema);
    const click = await createManualBooking({
      tripId: params.id,
      clickType: body.clickType,
      city: body.city,
      userId: userId ?? undefined,
      metadata: body.metadata,
    });
    return NextResponse.json({ click }, { status: 201 });
  }
);

const ConfirmBookingSchema = z.object({
  clickId: z.string().uuid(),
  confirmed: z.boolean(),
});

export const PATCH = apiHandler(
  "PATCH /api/v1/trips/:id/booking-clicks",
  async (req: NextRequest, params) => {
    await requireAuth();
    await assertTripAccess(req, params.id, { requireTripOwner: true });
    const { clickId, confirmed } = await parseAndValidateRequest(req, ConfirmBookingSchema);
    const click = await confirmBookingClick(clickId, confirmed);
    return NextResponse.json({ click });
  }
);
