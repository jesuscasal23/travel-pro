// ============================================================
// Travel Pro — GET /api/v1/affiliate/redirect
// Logs affiliate click then redirects to partner URL
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { apiHandler, getClientIp, parseAndValidateSearchParams } from "@/lib/api/helpers";
import { AffiliateRedirectQuerySchema } from "@/lib/features/affiliate/schema";
import { logAffiliateRedirect } from "@/lib/features/affiliate/redirect-service";

export const dynamic = "force-dynamic";

export const GET = apiHandler("GET /api/v1/affiliate/redirect", async (req: NextRequest) => {
  const query = parseAndValidateSearchParams(
    req.nextUrl.searchParams,
    AffiliateRedirectQuerySchema
  );
  const { redirectUrl } = await logAffiliateRedirect({
    ...query,
    ip: getClientIp(req),
  });

  return NextResponse.redirect(redirectUrl, { status: 302 });
});
