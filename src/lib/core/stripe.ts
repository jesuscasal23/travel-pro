import Stripe from "stripe";
import { getOptionalStripeEnv } from "@/lib/config/server-env";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

/**
 * Lazy-initialized Stripe client.
 * Follows the same pattern as prisma.ts — avoids instantiation at build time
 * when STRIPE_SECRET_KEY is not set.
 */
export function getStripe(): Stripe {
  if (globalForStripe.stripe) return globalForStripe.stripe;

  const env = getOptionalStripeEnv();
  if (!env) {
    throw new Error(
      "Stripe is not configured — STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required"
    );
  }

  const client = new Stripe(env.secretKey, { typescript: true });

  globalForStripe.stripe = client;
  return client;
}

/**
 * Named export convenience alias.
 * Uses a Proxy so Stripe is only instantiated on first property access,
 * keeping the build-time safety guarantee.
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});
