// ============================================================
// Travel Pro — POST /api/generate/select-route
//
// Phase 1 of 2-step generation: Haiku route selection only.
// Returns pre-selected cities so the main /api/generate can
// skip Stage A and stay well within Vercel's timeout.
//
// Rate limiting is handled by middleware (Upstash Redis sliding window).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { selectRoute } from "@/lib/ai/prompts/route-selector";
import { SelectRouteInputSchema } from "@/lib/api/schemas";
import { apiHandler, ApiError, parseJsonBody, validateBody } from "@/lib/api/helpers";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/generate/select-route");

export const dynamic = "force-dynamic";
export const maxDuration = 15; // Haiku is fast — 15s is generous

export const POST = apiHandler("POST /api/generate/select-route", async (req: NextRequest) => {
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  log.info("Request received");

  const body = await parseJsonBody(req);
  const { profile, tripIntent } = validateBody(SelectRouteInputSchema, body);

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ApiError(500, "Service is not configured");
  }
  log.info("Validated", {
    tripType: tripIntent.tripType,
    region: tripIntent.region,
    elapsed: elapsed(),
  });

  // ── Single-city short-circuit: return destination directly, skip Haiku ───
  if (tripIntent.tripType === "single-city" && tripIntent.destination) {
    const durationDays =
      tripIntent.dateStart && tripIntent.dateEnd
        ? Math.max(
            1,
            Math.round(
              (new Date(tripIntent.dateEnd).getTime() - new Date(tripIntent.dateStart).getTime()) /
                86400000
            )
          )
        : 7;
    log.info("Single-city shortcut", {
      destination: tripIntent.destination,
      days: durationDays,
      elapsed: elapsed(),
    });
    return NextResponse.json(
      {
        cities: [
          {
            id: tripIntent.destination.toLowerCase().replace(/\s+/g, "-"),
            city: tripIntent.destination,
            country: tripIntent.destinationCountry ?? "",
            countryCode: tripIntent.destinationCountryCode ?? "",
            iataCode: "",
            lat: tripIntent.destinationLat ?? 0,
            lng: tripIntent.destinationLng ?? 0,
            minDays: durationDays,
            maxDays: durationDays,
          },
        ],
      },
      { status: 200 }
    );
  }

  // ── Haiku route selection ─────────────────────────────────────────────────
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const cities = await selectRoute(profile, tripIntent, anthropic);
    log.info("Success", { cities: cities.length, elapsed: elapsed() });
    return NextResponse.json({ cities }, { status: 200 });
  } catch (err) {
    log.warn("Route selection failed", {
      elapsed: elapsed(),
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ cities: null }, { status: 200 });
  }
});
