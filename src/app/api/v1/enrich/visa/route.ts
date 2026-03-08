// ============================================================
// POST /api/v1/enrich/visa
// Lightweight endpoint for background visa enrichment.
// Called by the trip page after the core itinerary is displayed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { apiHandler, parseAndValidateRequest } from "@/lib/api/helpers";
import { EnrichVisaInputSchema } from "@/lib/features/enrichment/schemas";
import { getVisaEnrichment } from "@/lib/features/enrichment/service";

export const POST = apiHandler("POST /api/v1/enrich/visa", async (req: NextRequest) => {
  const input = await parseAndValidateRequest(req, EnrichVisaInputSchema);
  const visaData = await getVisaEnrichment(input);
  return NextResponse.json({ visaData });
});
