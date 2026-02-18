// ============================================================
// Travel Pro — POST /api/generate
//
// Triggers the AI generation pipeline:
// profile + tripIntent → Claude → parse/validate → enrich → store → return
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { generateItinerary } from "@/lib/ai/pipeline";
import type { UserProfile, TripIntent } from "@/types";

// Force dynamic rendering (no static caching for AI responses)
export const dynamic = "force-dynamic";

// Vercel Pro allows 60s; Hobby is 10s. For demo, use cached fallback if on Hobby.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // ── Parse request body ──────────────────────────────────────
  let profile: UserProfile;
  let tripIntent: TripIntent;

  try {
    const body = await req.json();
    profile = body.profile as UserProfile;
    tripIntent = body.tripIntent as TripIntent;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body — expected { profile, tripIntent }" },
      { status: 400 }
    );
  }

  // ── Basic validation ────────────────────────────────────────
  if (!profile || !tripIntent) {
    return NextResponse.json(
      { error: "Missing required fields: profile and tripIntent" },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
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
    const message = error instanceof Error ? error.message : "Generation failed";
    console.error("[/api/generate] Pipeline error:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
