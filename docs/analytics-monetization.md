# Monetization & Affiliate Analytics

_Last updated: 2026-04-02_

This document tracks the event taxonomy introduced for TRA-300 and how to review it in PostHog.

## Event taxonomy

| Event                                 | Fired from                                                                        | Properties                                                                                          | Notes                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `monetization_paywall_viewed`         | Premium page mount                                                                | `source`, `plans_presented`, `default_plan`                                                         | Triggers once per visit; `source` comes from `?source=` query.            |
| `monetization_paywall_dismissed`      | Premium page when tab hidden                                                      | `source`, `time_on_page_ms`                                                                         | Helps quantify short vs long engagements.                                 |
| `monetization_plan_selected`          | Plan card selections                                                              | `plan`, `source`                                                                                    | `plan` can be `lifetime`, `yearly`, `monthly`, `per-trip`.                |
| `monetization_checkout_started`       | Premium CTA click                                                                 | `plan`, `price`, `source`                                                                           | Sent before hitting `/api/v1/stripe/checkout`.                            |
| `monetization_checkout_completed`     | Stripe webhook + premium redirect                                                 | `plan`, `mode`, `amount_total`, `currency`, `checkout_session_id`, `source`                         | Server version is authoritative; filter by `channel = server`.            |
| `monetization_payment_failed`         | Stripe `invoice.payment_failed` webhook                                           | `invoice_id`, `amount_due`, `currency`, `plan`                                                      | Distinct ID is the customer/user.                                         |
| `monetization_subscription_activated` | Stripe webhook (`checkout.session.completed` for lifetime + subscription updates) | `plan`, `mode`, `stripe_subscription_id`, `status`                                                  | Fires whenever a user transitions into an active premium state.           |
| `affiliate_card_shown`                | Flight options CTA render                                                         | `provider`, `click_type`, `trip_id`, `placement`, `from_iata`, `to_iata`, `departure_date`          | Placement = `empty_state` or `footer`.                                    |
| `affiliate_link_clicked`              | Affiliate redirect endpoint + flight CTA click                                    | `provider`, `click_type`, `trip_id`, `city`, `destination`, `estimated_commission_eur`, `placement` | Server-side event guarantees capture; client copy adds placement context. |
| `affiliate_booking_confirmed`         | Booking confirmation API (manual + click confirmation)                            | `provider`, `click_type`, `trip_id`, `city`, `estimated_commission_eur`                             | Distinct ID = userId or tripId.                                           |

## Recommended PostHog views

Create a dashboard named **“Monetization Funnel”** with the following saved insights:

1. **Checkout Conversion** – Funnel: `monetization_paywall_viewed` → `monetization_plan_selected` → `monetization_checkout_started` → server `monetization_checkout_completed`. Filter `channel = server` for the terminal step; break down by `plan`.
2. **Plan Mix** – Bar chart counting `monetization_plan_selected` grouped by `plan`. Add property filter `source != 'direct'` to see campaign traffic.
3. **Subscription Health** – Timeseries of `monetization_subscription_activated` minus `monetization_payment_failed` grouped by `plan`. Highlights retention pressure.
4. **Affiliate CTR** – Funnel using `affiliate_card_shown` → **client** `affiliate_link_clicked` filtered by `placement`. Break down by `provider` once other partners come online.
5. **Affiliate Revenue Estimate** – Trend of the sum of `estimated_commission_eur` on server-side `affiliate_link_clicked` events (property filter `channel = server`). Add a table view grouped by `trip_id` to identify top earning itineraries.

Document any future after-the-fact dashboards in this file so we keep taxonomy + analysis in sync.
