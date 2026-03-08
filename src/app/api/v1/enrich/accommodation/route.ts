// ============================================================
// POST /api/v1/enrich/accommodation
// Background accommodation enrichment with Amadeus + AI ranking.
// Called by the trip page after the core itinerary is displayed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { enrichAccommodation } from "@/lib/ai/enrichment";
import { apiHandler, parseJsonBody, validateBody } from "@/lib/api/helpers";
import { EnrichAccommodationInputSchema } from "@/lib/api/schemas";

export const POST = apiHandler("POST /api/v1/enrich/accommodation", async (req: NextRequest) => {
  const body = await parseJsonBody(req);
  const { route, dateStart, travelers, travelStyle } = validateBody(
    EnrichAccommodationInputSchema,
    body
  );

  const accommodationData = await enrichAccommodation(route, dateStart, travelers, travelStyle);
  return NextResponse.json({ accommodationData });
});
