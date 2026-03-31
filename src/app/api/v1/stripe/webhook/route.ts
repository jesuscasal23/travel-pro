import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/core/stripe";
import { getOptionalStripeEnv } from "@/lib/config/server-env";
import { handleWebhookEvent } from "@/lib/features/stripe/stripe-service";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("stripe-webhook");

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const env = getOptionalStripeEnv();
  if (!env) {
    log.error("Stripe webhook received but Stripe is not configured");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.webhookSecret);
  } catch (err) {
    log.error("Webhook signature verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleWebhookEvent(event);
  } catch (err) {
    log.error("Webhook handler error", {
      eventType: event.type,
      error: err instanceof Error ? err.message : String(err),
    });
    // Still return 200 to prevent Stripe from retrying
  }

  return NextResponse.json({ received: true });
}
