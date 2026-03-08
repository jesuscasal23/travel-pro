// ============================================================
// POST /api/v1/enrich/accommodation
// Background accommodation enrichment with Amadeus + AI ranking.
// Called by the trip page after the core itinerary is displayed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { apiHandler, parseAndValidateRequest } from "@/lib/api/helpers";
import { EnrichAccommodationInputSchema } from "@/lib/features/enrichment/schemas";
import { getAccommodationEnrichment } from "@/lib/features/enrichment/service";

export const POST = apiHandler("POST /api/v1/enrich/accommodation", async (req: NextRequest) => {
  const input = await parseAndValidateRequest(req, EnrichAccommodationInputSchema);
  const accommodationData = await getAccommodationEnrichment(input);
  return NextResponse.json({ accommodationData });
});
