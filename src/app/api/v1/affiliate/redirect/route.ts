// ============================================================
// Travel Pro — GET /api/v1/affiliate/redirect
// Logs affiliate click then redirects to partner URL
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  provider: z.enum(["skyscanner", "booking", "getyourguide"]),
  type: z.enum(["flight", "hotel", "activity"]),
  dest: z.string().url("dest must be a valid URL"),
  itinerary_id: z.string().optional(),
  city: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = QuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { provider, type, dest, itinerary_id, city } = parsed.data;

  // Hash IP for privacy-preserving analytics
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

  // Log click asynchronously (don't block the redirect)
  try {
    // Find trip from itinerary if provided
    let tripId: string | undefined;
    if (itinerary_id) {
      const itinerary = await prisma.itinerary.findFirst({
        where: { id: itinerary_id },
        select: { tripId: true },
      });
      tripId = itinerary?.tripId;
    }

    await prisma.affiliateClick.create({
      data: {
        provider,
        clickType: type,
        city: city ?? null,
        destination: new URL(dest).hostname,
        url: dest,
        tripId: tripId ?? null,
        ipHash,
      },
    });
  } catch (err) {
    // Log but don't block the redirect
    console.error("[affiliate/redirect] Failed to log click:", err);
  }

  return NextResponse.redirect(dest, { status: 302 });
}
