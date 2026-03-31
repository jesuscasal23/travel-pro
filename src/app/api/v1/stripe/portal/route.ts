import { NextResponse } from "next/server";
import { apiHandler, requireAuth } from "@/lib/api/helpers";
import { createPortalSession } from "@/lib/features/stripe/stripe-service";

export const dynamic = "force-dynamic";

export const POST = apiHandler("POST /api/v1/stripe/portal", async () => {
  const userId = await requireAuth();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = await createPortalSession(userId, `${appUrl}/profile`);

  return NextResponse.json({ url });
});
