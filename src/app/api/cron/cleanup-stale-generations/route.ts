// ============================================================
// GET /api/cron/cleanup-stale-generations
// Called by Vercel Cron to mark stuck "generating" records as failed.
// Secured via CRON_SECRET bearer token (set automatically by Vercel).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/helpers";
import { runStaleGenerationCleanup } from "@/lib/features/cron/cleanup-service";

export const dynamic = "force-dynamic";

export const GET = apiHandler(
  "GET /api/cron/cleanup-stale-generations",
  async (req: NextRequest) => {
    return NextResponse.json(await runStaleGenerationCleanup(req.headers.get("authorization")));
  }
);
