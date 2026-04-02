export const MonetizationEvents = {
  PaywallViewed: "monetization_paywall_viewed",
  PaywallDismissed: "monetization_paywall_dismissed",
  PlanSelected: "monetization_plan_selected",
  CheckoutStarted: "monetization_checkout_started",
  CheckoutCompleted: "monetization_checkout_completed",
  PaymentFailed: "monetization_payment_failed",
  SubscriptionActivated: "monetization_subscription_activated",
} as const;

export type MonetizationEventName = (typeof MonetizationEvents)[keyof typeof MonetizationEvents];

export const AffiliateEvents = {
  CardShown: "affiliate_card_shown",
  LinkClicked: "affiliate_link_clicked",
  BookingConfirmed: "affiliate_booking_confirmed",
} as const;

export type AffiliateEventName = (typeof AffiliateEvents)[keyof typeof AffiliateEvents];
