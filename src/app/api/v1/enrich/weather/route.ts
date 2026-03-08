// ============================================================
// POST /api/v1/enrich/weather
// Lightweight endpoint for background weather enrichment.
// Called by the trip page after the core itinerary is displayed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { enrichWeather } from "@/lib/ai/enrichment";
import { apiHandler, parseJsonBody, validateBody } from "@/lib/api/helpers";
import { EnrichWeatherInputSchema } from "@/lib/api/schemas";

export const POST = apiHandler("POST /api/v1/enrich/weather", async (req: NextRequest) => {
  const body = await parseJsonBody(req);
  const { route, dateStart } = validateBody(EnrichWeatherInputSchema, body);

  const weatherData = await enrichWeather(
    route.map((r, i) => ({ id: String(i), days: 0, ...r })),
    dateStart
  );
  return NextResponse.json({ weatherData });
});
