// ============================================================
// POST /api/v1/enrich/visa
// Lightweight endpoint for background visa enrichment.
// Called by the trip page after the core itinerary is displayed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enrichVisa } from "@/lib/ai/enrichment";

const RequestSchema = z.object({
  nationality: z.string().min(1).max(100),
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

  const { nationality, route } = parsed.data;

  try {
    // enrichVisa is synchronous (static Passport Index lookup) — effectively instant
    const visaData = await enrichVisa(
      nationality,
      route.map((r, i) => ({ id: String(i), days: 0, ...r }))
    );
    return NextResponse.json({ visaData });
  } catch {
    return NextResponse.json({ error: "Visa enrichment failed" }, { status: 500 });
  }
}
