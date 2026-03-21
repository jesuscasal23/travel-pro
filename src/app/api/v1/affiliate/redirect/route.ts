// ============================================================
// Travel Pro — GET /api/v1/affiliate/redirect
// Logs affiliate click then redirects to partner URL
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { apiHandler, getClientIp, parseAndValidateSearchParams } from "@/lib/api/helpers";
import { AffiliateRedirectQuerySchema } from "@/lib/features/affiliate/schema";
import { logAffiliateRedirect } from "@/lib/features/affiliate/redirect-service";
import { getAuthenticatedUserId } from "@/lib/core/supabase-server";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/affiliate/redirect", async (req: NextRequest) => {
  const query = parseAndValidateSearchParams(
    req.nextUrl.searchParams,
    AffiliateRedirectQuerySchema
  );
  const userId = await getAuthenticatedUserId();
  const metadata = query.metadata ? (JSON.parse(query.metadata) as Record<string, unknown>) : null;
  const { redirectUrl } = await logAffiliateRedirect({
    ...query,
    ip: getClientIp(req),
    userId,
    metadata,
  });

  return NextResponse.redirect(redirectUrl, { status: 302 });
});
