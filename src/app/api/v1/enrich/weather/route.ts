// ============================================================
// POST /api/v1/enrich/weather
// Lightweight endpoint for background weather enrichment.
// Called by the trip page after the core itinerary is displayed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { apiHandler, parseAndValidateRequest } from "@/lib/api/helpers";
import { EnrichWeatherInputSchema } from "@/lib/features/enrichment/schemas";
import { getWeatherEnrichment } from "@/lib/features/enrichment/service";

export const POST = apiHandler("POST /api/v1/enrich/weather", async (req: NextRequest) => {
  const input = await parseAndValidateRequest(req, EnrichWeatherInputSchema);
  const weatherData = await getWeatherEnrichment(input);
  return NextResponse.json({ weatherData });
});
