# Fichi — Product Vision

> Last updated: 2026-04-03

## Mission

Fichi is a personal travel assistant for people who want a trip plan that feels tailored, opinionated, and easier to act on than a spreadsheet full of tabs.

**One-liner:** _A personal travel assistant that learns how you travel and helps you enjoy every trip more._

## Vision

Build a small, loyal base of repeat travelers who trust Fichi as their default planning companion. The product should feel more personal than an aggregator and more decisive than a generic trip organizer.

**North star metric:** share of users who plan a second trip within 6 months.

## Target User

### Primary

- 25–45
- English-speaking
- Plans 2–4 trips per year
- Comfortable with mobile-first products and AI assistance
- Feels overwhelmed by multi-city planning and decision fatigue

### Future

- Digital nomads and higher-frequency travelers
- Not the current priority until the repeat-trip loop is stronger

## Positioning

Fichi sits between travel search tools and manual trip organizers.

- Aggregators help users search but not decide
- Organizers help users store decisions they already made
- Fichi should help users decide, refine, and keep moving toward booking

The differentiator remains the combination of:

- Travel DNA / preference capture
- AI itinerary generation
- swipe-based activity discovery
- downstream enrichment for flights, hotels, visa, weather, and health

## Core Value Loop

1. Capture traveler preferences
2. Create a trip workspace quickly
3. Refine the itinerary through discovery and selections
4. Hand off to booking while retaining enough state to stay useful
5. Learn from repeated trips and selections

## Current Product State (v0.5, April 2026)

### What works well

- `/get-started` and `/plan` create a clearer front door into the product
- The authenticated trip workspace is now split into focused tabs for itinerary, flights, hotels, budget, and map
- Activity discovery is still the strongest product differentiator
- Enrichment coverage is broad: visa, weather, health, accommodation, and flights
- Cart or wallet behavior is real and backend-backed, not a mock shell
- Premium checkout is live for lifetime, yearly, and monthly plans

### What is still incomplete

| Area                  | State                                                                                                                                                 | Priority |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Booking completion    | Users can save selections and mark bookings, but the flow still hands off to external providers and does not ingest real confirmations automatically. | P0       |
| Cart / wallet polish  | The cart is useful, but it is still closer to a saved-selections wallet than a full booking-management product.                                       | P0       |
| Share trip            | Share remains unshipped. The UI still exposes a disabled "Soon" state.                                                                                | P1       |
| Per-trip unlock       | The premium page shows the plan, but checkout still blocks it as "Coming soon".                                                                       | P1       |
| Budget accuracy       | Budget reporting exists, but some categories still depend on partial or estimated data.                                                               | P2       |
| Post-booking guidance | Fichi is stronger before booking than after a user has already made selections.                                                                       | P2       |

### Technical debt worth cleaning up

- Superuser paywall shortcut still appears on the home page
- Some accommodation flows still fall back to generic Booking.com searches
- Internal `_dev` route visualizers remain in the repo

## Monetization Strategy

### Primary

- Lifetime: $499
- Yearly: $99
- Monthly: $12.99
- Per-trip: $19.99 displayed, but not yet checkout-enabled

Stripe is live for lifetime, yearly, and monthly. The next monetization decision is whether to enable the per-trip plan or remove it.

### Secondary

- Flight affiliate links
- Hotel affiliate links
- Activity affiliate links
- Booking confirmation events and click tracking for measurement

## Strategic Priorities

### P0 — Make booking feel more complete

- Deepen the cart into a fuller booking-management surface
- Improve confirmation flows after users leave for external booking
- Reduce the gap between selection and post-booking usefulness

### P1 — Ship or remove unclear growth and monetization surfaces

- Either implement share or remove the disabled share affordance
- Either enable per-trip checkout or stop presenting it as an option

### P1 — Strengthen repeat-trip retention

- Use prior trip behavior to improve future recommendations
- Make the home and trips surfaces more obviously useful between trips

### P2 — Quality and polish

- Improve budget confidence and category coverage
- Clean up technical debt like the paywall shortcut and accommodation fallbacks
- Keep the app opinionated and personal rather than turning it into a generic travel dashboard

## Principles

1. Personal over popular
2. Complete over bloated
3. Transparent over opaque
4. Mobile-first, desktop-capable
5. Loyal repeat users over shallow top-of-funnel volume

## Open Questions

1. Does per-trip monetization convert better than subscription for first-time payers?
2. Is share a real growth lever for this product, or just a nice-to-have?
3. How much post-booking functionality is necessary before the product feels complete?
4. When does English-only become a real ceiling?
