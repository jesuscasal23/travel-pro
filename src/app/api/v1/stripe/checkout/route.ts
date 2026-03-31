import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiHandler, parseAndValidateRequest } from "@/lib/api/helpers";
import { UnauthorizedError } from "@/lib/api/errors";
import { getAuthenticatedUser } from "@/lib/core/supabase-server";
import { createCheckoutSession } from "@/lib/features/stripe/stripe-service";
import { CheckoutInputSchema } from "@/lib/features/stripe/schemas";

export const dynamic = "force-dynamic";

export const POST = apiHandler("POST /api/v1/stripe/checkout", async (req: NextRequest) => {
  const user = await getAuthenticatedUser();
  if (!user) throw new UnauthorizedError();

  const { plan } = await parseAndValidateRequest(req, CheckoutInputSchema);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = await createCheckoutSession({
    userId: user.id,
    email: user.email ?? "",
    plan,
    returnUrl: `${appUrl}/premium`,
  });

  return NextResponse.json({ url });
});
