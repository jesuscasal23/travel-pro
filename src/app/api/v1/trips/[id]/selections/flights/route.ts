import { NextRequest, NextResponse } from "next/server";
import {
  apiHandler,
  requireAuth,
  requireProfile,
  assertTripAccess,
  parseAndValidateRequest,
} from "@/lib/api/helpers";
import {
  getFlightSelectionsForTrip,
  upsertFlightSelection,
  removeFlightSelection,
  markFlightBooked,
} from "@/lib/features/selections/selection-service";
import {
  UpsertFlightSelectionSchema,
  SelectionIdSchema,
  MarkSelectionSchema,
} from "@/lib/features/selections/schemas";

export const dynamic = "force-dynamic";

export const GET = apiHandler(
  "GET /api/v1/trips/:id/selections/flights",
  async (req: NextRequest, params) => {
    const userId = await requireAuth();
    await requireProfile(userId);
    await assertTripAccess(req, params.id, { requireTripOwner: true });
    const selections = await getFlightSelectionsForTrip(params.id);
    return NextResponse.json({ selections });
  }
);

export const PUT = apiHandler(
  "PUT /api/v1/trips/:id/selections/flights",
  async (req: NextRequest, params) => {
    const userId = await requireAuth();
    const profile = await requireProfile(userId);
    await assertTripAccess(req, params.id, { requireTripOwner: true });
    const body = await parseAndValidateRequest(req, UpsertFlightSelectionSchema);
    const selection = await upsertFlightSelection(params.id, profile.id, body);
    return NextResponse.json({ selection });
  }
);

export const DELETE = apiHandler(
  "DELETE /api/v1/trips/:id/selections/flights",
  async (req: NextRequest, params) => {
    const userId = await requireAuth();
    const profile = await requireProfile(userId);
    await assertTripAccess(req, params.id, { requireTripOwner: true });
    const { id } = await parseAndValidateRequest(req, SelectionIdSchema);
    await removeFlightSelection(id, profile.id);
    return NextResponse.json({ success: true });
  }
);

export const PATCH = apiHandler(
  "PATCH /api/v1/trips/:id/selections/flights",
  async (req: NextRequest, params) => {
    const userId = await requireAuth();
    const profile = await requireProfile(userId);
    await assertTripAccess(req, params.id, { requireTripOwner: true });
    const { id, booked } = await parseAndValidateRequest(req, MarkSelectionSchema);
    const selection = await markFlightBooked(id, profile.id, booked);
    return NextResponse.json({ selection });
  }
);
