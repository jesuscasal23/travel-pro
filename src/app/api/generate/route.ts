// ============================================================
// Travel Pro — POST /api/generate
//
// Triggers the AI generation pipeline:
// profile + tripIntent → Claude → parse/validate → enrich → store → return
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateItinerary } from "@/lib/ai/pipeline";
import { getClientIp } from "@/lib/api/helpers";
import { ProfileInputSchema } from "@/lib/api/schemas";

// Force dynamic rendering (no static caching for AI responses)
export const dynamic = "force-dynamic";

// Vercel Pro allows 60s; Hobby is 10s. For demo, use cached fallback if on Hobby.
export const maxDuration = 60;

// ── Rate limiter (lazy init — only created on first request, not at build time) ──
let _ratelimit: import("@upstash/ratelimit").Ratelimit | null | undefined;

function getRatelimit() {
  if (_ratelimit !== undefined) return _ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url?.startsWith("https://") && token) {
    // Dynamic import avoided — use direct require since these are already in node_modules
    const { Ratelimit } = require("@upstash/ratelimit") as typeof import("@upstash/ratelimit");
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
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
// Validates and bounds all user-controlled fields before they reach the AI pipeline.
// This prevents prompt injection, runaway token costs, and malformed data.
const RequestSchema = z.object({
  profile: ProfileInputSchema,
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