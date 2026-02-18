// ============================================================
// Travel Pro — GET /api/v1/trips/shared/[token]
// Public endpoint — returns a shared trip + active itinerary (no auth required)
// Rate limited to 60 req/min per IP
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiter (per process — use Upstash in production)
const hitMap = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 60;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = hitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    hitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params;

  // Rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const trip = await prisma.trip.findFirst({
      where: { shareToken: token },
      include: {
        itineraries: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!trip || trip.itineraries.length === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Return only the public fields (no profile/user data)
    return NextResponse.json({
      trip: {
        id: trip.id,
        region: trip.region,
        dateStart: trip.dateStart,
        dateEnd: trip.dateEnd,
        budget: trip.budget,
        vibe: trip.vibe,
        travelers: trip.travelers,
      },
      itinerary: trip.itineraries[0].data,
    });
  } catch (err) {
    console.error("[GET /api/v1/trips/shared/:token]", err);
    return NextResponse.json({ error: "Failed to load trip" }, { status: 500 });
  }
}
