// ============================================================
// Travel Pro — GET /api/v1/trips/[id]/share
// Generate (or return existing) share token for a trip
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://travelpro.app";

interface Params {
  params: Promise<{ id: string }>;
}

function generateShareToken(): string {
  return crypto.randomBytes(9).toString("base64url"); // 12-char URL-safe token
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    let trip = await prisma.trip.findUnique({
      where: { id },
      select: { id: true, shareToken: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Generate token if not exists
    if (!trip.shareToken) {
      trip = await prisma.trip.update({
        where: { id },
        data: { shareToken: generateShareToken() },
        select: { id: true, shareToken: true },
      });
    }

    const shareUrl = `${APP_URL}/share/${trip.shareToken}`;
    return NextResponse.json({ shareToken: trip.shareToken, shareUrl });
  } catch (err) {
    console.error("[GET /api/v1/trips/:id/share]", err);
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 });
  }
}
