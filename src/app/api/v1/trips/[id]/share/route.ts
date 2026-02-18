// ============================================================
// Travel Pro — GET /api/v1/trips/[id]/share
// Generate (or return existing) share token for a trip
// ============================================================
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiHandler, ApiError, requireAuth, requireProfile } from "@/lib/api/helpers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://travelpro.app";

function generateShareToken(): string {
  return crypto.randomBytes(9).toString("base64url"); // 12-char URL-safe token
}

export const GET = apiHandler("GET /api/v1/trips/:id/share", async (_req, params) => {
  const userId = await requireAuth();
  const profile = await requireProfile(userId);

  let trip = await prisma.trip.findUnique({
    where: { id: params.id },
    select: { id: true, shareToken: true, profileId: true },
  });

  if (!trip) throw new ApiError(404, "Trip not found");
  if (trip.profileId !== profile.id) throw new ApiError(403, "Forbidden");

  // Generate token if not exists
  if (!trip.shareToken) {
    trip = await prisma.trip.update({
      where: { id: params.id },
      data: { shareToken: generateShareToken() },
      select: { id: true, shareToken: true, profileId: true },
    });
  }

  const shareUrl = `${APP_URL}/share/${trip.shareToken}`;
  return NextResponse.json({ shareToken: trip.shareToken, shareUrl });
});
