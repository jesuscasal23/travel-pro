// ============================================================
// GET /api/cron/cleanup-stale-generations
// Called by Vercel Cron to mark stuck "generating" records as failed.
// Secured via CRON_SECRET bearer token (set automatically by Vercel).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/helpers";
import { cleanupStaleGenerations } from "@/lib/services/itinerary-service";
import { createLogger } from "@/lib/logger";

const log = createLogger("cron/cleanup");

export const dynamic = "force-dynamic";

export const GET = apiHandler(
  "GET /api/cron/cleanup-stale-generations",
  async (req: NextRequest) => {
    // Verify Vercel cron secret — reject unauthorized callers
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      log.warn("Unauthorized cron attempt");
      throw new ApiError(401, "Unauthorized");
    }

    const cleaned = await cleanupStaleGenerations();
    log.info("Cron cleanup completed", { cleaned });
    return NextResponse.json({ ok: true, cleaned });
  }
);
