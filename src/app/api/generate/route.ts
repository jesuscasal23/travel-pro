// ============================================================
// Travel Pro — POST /api/generate
//
// Phase 2 of 2-step generation (or standalone for direct callers):
// profile + tripIntent + optional cities → Claude → parse/validate → enrich → store → return
//
// When called with pre-selected cities from /api/generate/select-route,
// skips the Haiku route selection stage — keeping each request well under
// Vercel's 60-second timeout.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { generateItinerary } from "@/lib/ai/pipeline";
import { getClientIp } from "@/lib/api/helpers";
import {
  ProfileInputSchema,
  TripIntentInputSchema,
  CityWithDaysInputSchema,
} from "@/lib/api/schemas";

// Force dynamic rendering (no static caching for AI responses)
export const dynamic = "force-dynamic";

// Vercel Pro allows 60s; Hobby is 10s.
export const maxDuration = 60;

// ── Rate limiter (lazy init — only created on first request, not at build time) ──
let _ratelimit: Ratelimit | null | undefined;

function getRatelimit(): Ratelimit | null {
  if (_ratelimit !== undefined) return _ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url?.startsWith("https://") && token) {
    _ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: false,
    });
  } else {
    _ratelimit = null;
  }
  return _ratelimit;
}

// ── Input validation schema ──────────────────────────────────────────────────
const RequestSchema = z.object({
  profile: ProfileInputSchema,
  tripIntent: TripIntentInputSchema,
  cities: z.array(CityWithDaysInputSchema).max(10).nullish(),
});

export async function POST(req: NextRequest) {
  // ── Parse + validate request body (before rate limiting so we can check cities) ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body — expected JSON" },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { profile, tripIntent, cities } = parsed.data;

  // ── Rate limiting (skip when cities provided — already rate-limited on select-route) ──
  if (!cities) {
    try {
      const ratelimit = getRatelimit();
      if (ratelimit) {
        const ip = getClientIp(req);
        const { success } = await ratelimit.limit(ip);
        if (!success) {
          return NextResponse.json(
            { error: "Too many requests. Please wait a moment before trying again." },
            { status: 429 }
          );
        }
      }
    } catch (err) {
      console.warn("[/api/generate] Rate limiting failed, allowing request:", err instanceof Error ? err.message : err);
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Service is not configured" },
      { status: 500 }
    );
  }

  // ── Run pipeline ────────────────────────────────────────────
  try {
    const itinerary = await generateItinerary(
      profile,
      tripIntent,
      cities ?? undefined
    );

    return NextResponse.json(
      { success: true, itinerary },
      { status: 200 }
    );
  } catch (error) {
    // Log the full detail server-side; return a generic message to the client
    console.error("[/api/generate] Pipeline error:", error instanceof Error ? error.message : error);

    return NextResponse.json(
      { error: "Trip generation failed. Please try again." },
      { status: 500 }
    );
  }
}
