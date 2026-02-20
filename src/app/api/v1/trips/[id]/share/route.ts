// ============================================================
// Travel Pro — GET /api/v1/trips/[id]/share
// Generate (or return existing) share token for a trip
// ============================================================
import { NextResponse } from "next/server";
import { apiHandler, requireAuth, requireProfile, requireTripOwnership } from "@/lib/api/helpers";
import { ensureShareToken } from "@/lib/services/trip-service";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://travelpro.app";

export const GET = apiHandler("GET /api/v1/trips/:id/share", async (_req, params) => {
  const userId = await requireAuth();
  const profile = await requireProfile(userId);
  await requireTripOwnership(params.id, profile.id);

  const shareToken = await ensureShareToken(params.id);
  const shareUrl = `${APP_URL}/share/${shareToken}`;

  return NextResponse.json({ shareToken, shareUrl });
});
