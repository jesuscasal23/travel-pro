import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import {
  apiHandler,
  requireAuth,
  requireProfile,
  assertTripAccess,
  parseAndValidateRequest,
} from "@/lib/api/helpers";
import { MarkSelectionSchema, SelectionIdSchema } from "./schemas";

type SelectionKind = "flights" | "hotels";

interface SelectionRouteDefinition<TInput, TSelection> {
  kind: SelectionKind;
  upsertSchema: z.ZodType<TInput>;
  listSelections: (tripId: string) => Promise<TSelection[]>;
  upsertSelection: (tripId: string, profileId: string, input: TInput) => Promise<TSelection>;
  removeSelection: (selectionId: string, profileId: string) => Promise<unknown>;
  markSelectionBooked: (
    selectionId: string,
    profileId: string,
    booked?: boolean
  ) => Promise<TSelection>;
}

async function requireSelectionOwner(req: NextRequest, tripId: string) {
  const userId = await requireAuth();
  const profile = await requireProfile(userId);
  await assertTripAccess(req, tripId, { requireTripOwner: true });
  return profile;
}

export function createSelectionRoutes<TInput, TSelection>({
  kind,
  upsertSchema,
  listSelections,
  upsertSelection,
  removeSelection,
  markSelectionBooked,
}: SelectionRouteDefinition<TInput, TSelection>) {
  const routeName = `/api/v1/trips/:id/selections/${kind}`;

  const GET = apiHandler(`GET ${routeName}`, async (req: NextRequest, params) => {
    await requireSelectionOwner(req, params.id);
    const selections = await listSelections(params.id);
    return NextResponse.json({ selections });
  });

  const PUT = apiHandler(`PUT ${routeName}`, async (req: NextRequest, params) => {
    const profile = await requireSelectionOwner(req, params.id);
    const body = await parseAndValidateRequest(req, upsertSchema);
    const selection = await upsertSelection(params.id, profile.id, body);
    return NextResponse.json({ selection });
  });

  const DELETE = apiHandler(`DELETE ${routeName}`, async (req: NextRequest, params) => {
    const profile = await requireSelectionOwner(req, params.id);
    const { id } = await parseAndValidateRequest(req, SelectionIdSchema);
    await removeSelection(id, profile.id);
    return NextResponse.json({ success: true });
  });

  const PATCH = apiHandler(`PATCH ${routeName}`, async (req: NextRequest, params) => {
    const profile = await requireSelectionOwner(req, params.id);
    const { id, booked } = await parseAndValidateRequest(req, MarkSelectionSchema);
    const selection = await markSelectionBooked(id, profile.id, booked);
    return NextResponse.json({ selection });
  });

  return { GET, PUT, DELETE, PATCH };
}
