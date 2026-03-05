// ============================================================
// POST /api/v1/enrich/accommodation
// Background accommodation enrichment with Amadeus + AI ranking.
// Called by the trip page after the core itinerary is displayed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enrichAccommodation } from "@/lib/ai/enrichment";

const RequestSchema = z.object({
  route: z
    .array(
      z.object({
        id: z.string(),
        city: z.string(),
        country: z.string(),
        countryCode: z.string(),
        lat: z.number(),
        lng: z.number(),
        days: z.number(),
        iataCode: z.string().optional(),
      })
    )
    .min(1)
    .max(20),
  dateStart: z.string().min(1).max(20),
  travelers: z.number().int().min(1).max(20),
  travelStyle: z.enum(["backpacker", "comfort", "luxury"]),
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

  const { route, dateStart, travelers, travelStyle } = parsed.data;

  try {
    const accommodationData = await enrichAccommodation(route, dateStart, travelers, travelStyle);
    return NextResponse.json({ accommodationData });
  } catch {
    return NextResponse.json({ error: "Accommodation enrichment failed" }, { status: 500 });
  }
}
