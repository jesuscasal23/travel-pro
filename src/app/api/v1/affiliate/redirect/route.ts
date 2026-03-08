// ============================================================
// Travel Pro — GET /api/v1/affiliate/redirect
// Logs affiliate click then redirects to partner URL
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { apiHandler, getClientIp, validateBody } from "@/lib/api/helpers";
import { AffiliateRedirectQuerySchema } from "@/lib/api/schemas";
import { createLogger } from "@/lib/logger";

const log = createLogger("affiliate/redirect");

export const dynamic = "force-dynamic";

const ALLOWED_REDIRECT_DOMAINS = [
  "skyscanner.net",
  "skyscanner.com",
  "booking.com",
  "getyourguide.com",
];

function isAllowedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return ALLOWED_REDIRECT_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export const GET = apiHandler("GET /api/v1/affiliate/redirect", async (req: NextRequest) => {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const { provider, type, dest, itinerary_id, city } = validateBody(
    AffiliateRedirectQuerySchema,
    params
  );

  if (!isAllowedDomain(dest)) {
    return NextResponse.json({ error: "Redirect destination not allowed" }, { status: 400 });
  }

  // Hash IP for privacy-preserving analytics
  const ip = getClientIp(req);
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
    log.error("Failed to log click", { error: err instanceof Error ? err.message : String(err) });
  }

  return NextResponse.redirect(dest, { status: 302 });
});
