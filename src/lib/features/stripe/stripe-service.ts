import type Stripe from "stripe";
import { stripe } from "@/lib/core/stripe";
import { prisma } from "@/lib/core/prisma";
import { getOptionalStripeEnv } from "@/lib/config/server-env";
import { createLogger } from "@/lib/core/logger";
import { BadRequestError } from "@/lib/api/errors";
import type { CheckoutInput } from "./schemas";

const log = createLogger("stripe");

// ── Helpers ────────────────────────────────────────────────────

function requireStripeEnv() {
  const env = getOptionalStripeEnv();
  if (!env) throw new BadRequestError("Stripe is not configured");
  return env;
}

function priceIdForPlan(
  plan: CheckoutInput["plan"],
  env: ReturnType<typeof requireStripeEnv>
): string {
  switch (plan) {
    case "lifetime":
      return env.priceLifetime;
    case "yearly":
      return env.priceYearly;
    case "monthly":
      return env.priceMonthly;
  }
}

// ── Customer management ────────────────────────────────────────

async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (profile?.stripeCustomerId) return profile.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await prisma.profile.update({
    where: { userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ── Checkout ───────────────────────────────────────────────────

export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  plan: CheckoutInput["plan"];
  returnUrl: string;
}): Promise<string> {
  const env = requireStripeEnv();
  const customerId = await getOrCreateStripeCustomer(params.userId, params.email);
  const priceId = priceIdForPlan(params.plan, env);

  const isSubscription = params.plan !== "lifetime";

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: isSubscription ? "subscription" : "payment",
    success_url: `${params.returnUrl}?checkout=success`,
    cancel_url: params.returnUrl,
    metadata: { userId: params.userId, plan: params.plan },
  };

  // 7-day free trial for yearly plan
  if (params.plan === "yearly") {
    sessionParams.subscription_data = { trial_period_days: 7 };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new BadRequestError("Failed to create checkout session");
  }

  return session.url;
}

// ── Customer Portal ────────────────────────────────────────────

export async function createPortalSession(userId: string, returnUrl: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (!profile?.stripeCustomerId) {
    throw new BadRequestError("No billing account found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

// ── Webhook event handling ─────────────────────────────────────

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      log.warn("Invoice payment failed", {
        invoiceId: (event.data.object as Stripe.Invoice).id,
        customer: String((event.data.object as Stripe.Invoice).customer),
      });
      break;
    default:
      log.info("Unhandled Stripe event", { type: event.type });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId) {
    log.error("Checkout session missing customer", { sessionId: session.id });
    return;
  }

  // For one-time payments (lifetime), set isPremium directly.
  // Subscriptions are handled by subscription events.
  if (session.mode === "payment") {
    await prisma.profile.update({
      where: { stripeCustomerId: customerId },
      data: { isPremium: true },
    });
    log.info("Lifetime purchase completed", { customerId });
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id ?? null;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : null;

  await prisma.profile.update({
    where: { stripeCustomerId: customerId },
    data: {
      isPremium: isActive,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: periodEnd,
    },
  });

  log.info("Subscription updated", {
    customerId,
    status: subscription.status,
    isPremium: isActive,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  await prisma.profile.update({
    where: { stripeCustomerId: customerId },
    data: {
      isPremium: false,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });

  log.info("Subscription deleted", { customerId });
}

// ── GDPR cleanup ───────────────────────────────────────────────

export async function cancelStripeSubscription(userId: string): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  });

  if (!profile) return;

  try {
    if (profile.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(profile.stripeSubscriptionId);
      log.info("Cancelled Stripe subscription for account deletion", { userId });
    }

    if (profile.stripeCustomerId) {
      await stripe.customers.del(profile.stripeCustomerId);
      log.info("Deleted Stripe customer for account deletion", { userId });
    }
  } catch (err) {
    // Log but don't block account deletion
    log.error("Stripe cleanup failed during account deletion", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
