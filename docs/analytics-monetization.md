# Monetization & Affiliate Analytics

_Last verified: 2026-04-03_

This document tracks the current event taxonomy used for monetization and affiliate reporting in PostHog.

## Event taxonomy

| Event                                 | Fired from                                                               | Properties                                                                                          | Notes                                                         |
| ------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `monetization_paywall_viewed`         | Premium page mount                                                       | `source`, `plans_presented`, `default_plan`                                                         | Triggers once per visit.                                      |
| `monetization_paywall_dismissed`      | Premium page when tab becomes hidden                                     | `source`, `time_on_page_ms`                                                                         | Useful for measuring short vs long paywall sessions.          |
| `monetization_plan_selected`          | Premium plan-card selection                                              | `plan`, `source`                                                                                    | `plan` may be `lifetime`, `yearly`, `monthly`, or `per-trip`. |
| `monetization_checkout_started`       | Premium CTA click                                                        | `plan`, `price`, `source`                                                                           | Fired before calling `/api/v1/stripe/checkout`.               |
| `monetization_checkout_completed`     | Stripe webhook and premium redirect confirmation                         | `plan`, `mode`, `amount_total`, `currency`, `checkout_session_id`, `source`                         | Server events are authoritative for reporting.                |
| `monetization_payment_failed`         | Stripe `invoice.payment_failed` webhook                                  | `invoice_id`, `amount_due`, `currency`, `plan`                                                      | Use server events for subscription health reporting.          |
| `monetization_subscription_activated` | Stripe webhook after premium state activation                            | `plan`, `mode`, `stripe_subscription_id`, `status`                                                  | Fires on active premium transitions.                          |
| `affiliate_card_shown`                | Flight options CTA render                                                | `provider`, `click_type`, `trip_id`, `placement`, `from_iata`, `to_iata`, `departure_date`          | Placement is currently emitted from the flight options UI.    |
| `affiliate_link_clicked`              | Affiliate redirect endpoint, booking-click service, and flight CTA click | `provider`, `click_type`, `trip_id`, `city`, `destination`, `estimated_commission_eur`, `placement` | Prefer server-captured events for monetization analysis.      |
| `affiliate_booking_confirmed`         | Booking confirmation API and manual booking creation                     | `provider`, `click_type`, `trip_id`, `city`, `estimated_commission_eur`                             | Distinct ID is userId when available, otherwise tripId.       |

## Notes

- The premium page still presents a `per-trip` option in analytics even though checkout for that plan is not yet enabled.
- For revenue or funnel reporting, prefer server-captured Stripe and affiliate events over client-only copies.

## Recommended PostHog Views

Create a dashboard named **Monetization Funnel** with these saved insights:

1. Checkout conversion: `monetization_paywall_viewed` -> `monetization_plan_selected` -> `monetization_checkout_started` -> server `monetization_checkout_completed`
2. Plan mix: count `monetization_plan_selected` by `plan`
3. Subscription health: trend `monetization_subscription_activated` against `monetization_payment_failed`
4. Affiliate CTR: `affiliate_card_shown` -> `affiliate_link_clicked`, broken down by `provider` or `placement`
5. Affiliate revenue estimate: sum `estimated_commission_eur` on server `affiliate_link_clicked`
