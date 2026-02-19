// ============================================================
// Travel Pro — POST /api/generate/select-route
//
// Phase 1 of 2-step generation: Haiku route selection only.
// Returns pre-selected cities so the main /api/generate can
// skip Stage A and stay well within Vercel's timeout.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import Anthropic from "@anthropic-ai/sdk";
import { selectRoute } from "@/lib/ai/prompts/route-selector";
import { getClientIp } from "@/lib/api/helpers";
import { ProfileInputSchema, TripIntentInputSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";
export const maxDuration = 15; // Haiku is fast — 15s is generous

// ── Rate limiter (lazy init) ────────────────────────────────────────────────
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

// ── Input validation ────────────────────────────────────────────────────────
const RequestSchema = z.object({
  profile: ProfileInputSchema,
  tripIntent: TripIntentInputSchema,
});

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  console.log("[/api/generate/select-route] Request received");

  // ── Rate limiting (fail open) ─────────────────────────────────────────────
  try {
    const ratelimit = getRatelimit();
    if (ratelimit) {
      const ip = getClientIp(req);
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        console.warn(`[/api/generate/select-route] Rate limited [${elapsed()}]`);
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment before trying again." },
          { status: 429 }
        );
      }
    }
  } catch (err) {
    console.warn(
      "[/api/generate/select-route] Rate limiting failed:",
      err instanceof Error ? err.message : err
    );
  }

  // ── Parse + validate ──────────────────────────────────────────────────────
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Service is not configured" },
      { status: 500 }
    );
  }

  const { profile, tripIntent } = parsed.data;
  console.log(`[/api/generate/select-route] Validated — region=${tripIntent.region} [${elapsed()}]`);

  // ── Haiku route selection ─────────────────────────────────────────────────
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const cities = await selectRoute(profile, tripIntent, anthropic);
    console.log(`[/api/generate/select-route] ✓ Success — ${cities.length} cities [${elapsed()}]`);
    return NextResponse.json({ cities }, { status: 200 });
  } catch (err) {
    console.warn(
      `[/api/generate/select-route] ✗ Route selection failed after ${elapsed()}:`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ cities: null }, { status: 200 });
  }
}
