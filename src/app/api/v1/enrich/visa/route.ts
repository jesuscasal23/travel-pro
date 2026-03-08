// ============================================================
// POST /api/v1/enrich/visa
// Lightweight endpoint for background visa enrichment.
// Called by the trip page after the core itinerary is displayed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { enrichVisa } from "@/lib/ai/enrichment";
import { apiHandler, parseJsonBody, validateBody } from "@/lib/api/helpers";
import { EnrichVisaInputSchema } from "@/lib/api/schemas";

export const POST = apiHandler("POST /api/v1/enrich/visa", async (req: NextRequest) => {
  const body = await parseJsonBody(req);
  const { nationality, route } = validateBody(EnrichVisaInputSchema, body);

  // enrichVisa is synchronous (static Passport Index lookup) — effectively instant
  const visaData = await enrichVisa(
    nationality,
    route.map((r, i) => ({ id: String(i), days: 0, ...r }))
  );
  return NextResponse.json({ visaData });
});
