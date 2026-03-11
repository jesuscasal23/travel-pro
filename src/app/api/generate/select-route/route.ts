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
import { apiHandler, parseAndValidateRequest } from "@/lib/api/helpers";
import { SelectRouteInputSchema } from "@/lib/features/generation/schemas";
import { selectRouteCandidates } from "@/lib/features/generation/route-selection-service";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("api/generate/select-route");

export const dynamic = "force-dynamic";
export const maxDuration = 15; // Haiku is fast — 15s is generous

export const POST = apiHandler("POST /api/generate/select-route", async (req: NextRequest) => {
  const signal = req.signal;
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  log.info("Request received");

  const { profile, tripIntent } = await parseAndValidateRequest(req, SelectRouteInputSchema);

  log.info("Validated", {
    tripType: tripIntent.tripType,
    region: tripIntent.region,
    elapsed: elapsed(),
  });

  const result = await selectRouteCandidates({ profile, tripIntent }, signal);
  log.info("Route selection completed", {
    cities: result.cities?.length ?? 0,
    elapsed: elapsed(),
  });
  return NextResponse.json(result, { status: 200 });
});
