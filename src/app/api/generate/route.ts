// ============================================================
// Travel Pro — POST /api/generate
//
// Triggers the AI generation pipeline:
// profile + tripIntent → Claude → parse/validate → enrich → store → return
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import { generateItinerary } from "@/lib/ai/pipeline";

// Force dynamic rendering (no static caching for AI responses)
export const dynamic = "force-dynamic";

// Vercel Pro allows 60s; Hobby is 10s. For demo, use cached fallback if on Hobby.
export const maxDuration = 60;

// ── Rate limiter (only active when Upstash env vars are configured) ──────────
// Falls back gracefully in local dev without Redis
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute per IP
        analytics: false,
      })
    : null;

// ── Input validation schema ──────────────────────────────────────────────────
// Validates and bounds all user-controlled fields before they reach the AI pipeline.
// This prevents prompt injection, runaway token costs, and malformed data.
const RequestSchema = z.object({
  profile: z.object({
    nationality: z.string().min(1).max(100),
    homeAirport: z.string().min(2).max(100),
    travelStyle: z.enum(["backpacker", "comfort", "luxury"]),
    interests: z.array(z.string().max(50)).max(10),
  }),
  tripIntent: z.object({
    id: z.string().max(100),
    region: z.string().min(1).max(100),
    dateStart: z.string().max(20),
    dateEnd: z.string().max(20),
    flexibleDates: z.boolean(),
    budget: z.number().positive().max(1_000_000),
    vibe: z.enum(["relaxation", "adventure", "cultural", "mix"]),
    travelers: z.number().int().min(1).max(20),
  }),
});

export async function POST(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────
  if (ratelimit) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }
  }

  // ── Parse + validate request body ───────────────────────────
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

  const { profile, tripIntent } = parsed.data;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Service is not configured" },
      { status: 500 }
    );
  }

  // ── Run pipeline ────────────────────────────────────────────
  try {
    const itinerary = await generateItinerary(profile, tripIntent);

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