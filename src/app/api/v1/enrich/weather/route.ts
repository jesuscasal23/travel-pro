// ============================================================
// POST /api/v1/enrich/weather
// Lightweight endpoint for background weather enrichment.
// Called by the trip page after the core itinerary is displayed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enrichWeather } from "@/lib/ai/enrichment";

const RequestSchema = z.object({
  route: z
    .array(
      z.object({
        city: z.string(),
        country: z.string(),
        countryCode: z.string(),
        lat: z.number(),
        lng: z.number(),
      })
    )
    .min(1)
    .max(20),
  dateStart: z.string().min(1).max(20),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { route, dateStart } = parsed.data;

  try {
    const weatherData = await enrichWeather(
      route.map((r, i) => ({ id: String(i), days: 0, ...r })),
      dateStart
    );
    return NextResponse.json({ weatherData });
  } catch {
    return NextResponse.json({ error: "Weather enrichment failed" }, { status: 500 });
  }
}
