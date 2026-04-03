# Fichi — Application Overview

> Last verified against codebase: 2026-04-03

Fichi is a mobile-first AI trip planner. The current product centers on a Travel DNA onboarding flow, a planner that creates a trip workspace, and authenticated trip management across itinerary, flights, hotels, budget, map, cart, profile, feedback, premium, and admin surfaces.

## Pages & Purpose

| Page              | Route                   | Auth           | Purpose                                                              |
| ----------------- | ----------------------- | -------------- | -------------------------------------------------------------------- |
| Marketing landing | `/`                     | No             | Public homepage with app positioning and CTA into onboarding         |
| Privacy policy    | `/privacy`              | No             | Privacy and data-handling details                                    |
| Sign up           | `/signup`               | No             | Email/password account creation                                      |
| Log in            | `/login`                | No             | Sign-in entrypoint with `?next=` support                             |
| Forgot password   | `/forgot-password`      | No             | Password reset request                                               |
| Reset password    | `/reset-password`       | No             | Password reset completion                                            |
| Auth callback     | `/auth/callback`        | No             | Supabase code exchange then redirect                                 |
| Travel DNA intro  | `/get-started`          | No             | Start of the public onboarding funnel                                |
| Travel DNA steps  | `/get-started/*`        | No             | Advantage, personalization, vibes, interests, budget, rhythm         |
| Planner           | `/plan`                 | No             | Collect profile basics, destinations, dates, and planning priorities |
| Home              | `/home`                 | Yes            | Personalized landing surface for signed-in users                     |
| Trips list        | `/trips`                | Yes            | Saved trip collection                                                |
| Trip overview     | `/trips/[id]`           | Yes            | Next-step summary for a trip plus visa status                        |
| Trip itinerary    | `/trips/[id]/itinerary` | Yes            | Primary day-by-day planning and activity discovery surface           |
| Trip flights      | `/trips/[id]/flights`   | Yes            | Flight search, selection, and booking handoff                        |
| Trip hotels       | `/trips/[id]/hotels`    | Yes            | Accommodation recommendations and hotel selection                    |
| Trip budget       | `/trips/[id]/budget`    | Yes            | Budget rollup plus outbound booking links                            |
| Trip map          | `/trips/[id]/map`       | Yes            | Route and selected-booking map view                                  |
| Cart / wallet     | `/cart`                 | Yes            | Saved flight and hotel selections across trips                       |
| Profile           | `/profile`              | Yes            | Preferences, export, deletion, billing access, feedback entry        |
| Premium           | `/premium`              | Yes            | Subscription paywall and Stripe checkout entry                       |
| Feedback          | `/feedback`             | Yes            | User feedback history and submission flow                            |
| Admin             | `/admin`                | Yes, superuser | Internal stats, users, trips, and feedback queue                     |

## Canonical User Flow

### 1. Discovery and onboarding

- A new user starts at `/` or `/get-started`.
- `/get-started/*` captures high-level travel preferences and hands off to `/plan`.

### 2. Planning

- `/plan` collects nationality, home airport, destinations, dates, and planning priorities.
- If the user is signed in, the planner persists profile preferences before trip creation.
- The planner creates a trip record, seeds an initial itinerary skeleton, and redirects into `/trips/[id]/itinerary?firstRun=1`.
- Anonymous users can explore the planner UI, but the canonical trip-workspace flow is authenticated before trip creation.

### 3. Trip workspace

- `/trips/[id]/itinerary` is the main build surface.
- The trip workspace is split into focused sub-pages:
  - itinerary: activities and discovery
  - flights: search and save flight options
  - hotels: accommodation suggestions and save hotel options
  - budget: budget rollup and outbound booking links
  - map: route plus selected bookings
- `/trips/[id]` acts as a lightweight overview page that pushes the user toward the next missing step.

### 4. Post-plan management

- `/trips` lists saved trips.
- `/home` highlights the next upcoming trip and preparation tasks.
- `/cart` aggregates saved flight and hotel selections across trips.
- `/profile` exposes profile editing, data export, account deletion, and billing portal access.
- `/feedback` stores authenticated user feedback submissions.

## What The App Does Today

- AI-assisted trip setup for single-city and multi-city journeys
- Travel DNA onboarding and planner preference capture
- Itinerary workspace with activity discovery and assignment
- Visa, weather, health, and accommodation enrichment
- Flight search and flight price optimization
- Hotel recommendations and hotel selection saving
- Cross-trip cart for saved flights and hotels
- Affiliate click tracking and manual booking confirmation flows
- Stripe checkout and billing portal for premium plans
- GDPR export and account deletion
- Superuser admin pages for stats, users, trips, and feedback moderation

## Not Shipped Or Intentionally Missing

- Public share pages and share tokens are not live
- A separate `/trip/[id]/summary` page does not exist in the current app
- Inline collaborative planning is not supported
- Native booking is not supported; booking handoff goes to external providers
- Public guest trip-management pages are not part of the current canonical UI
- Native mobile apps and offline mode do not exist

## Notes For External Briefings

- The current app shell is `/trips/*`, not the older `/trip/*` route family.
- The cart or wallet flow is real and backed by selections APIs.
- The premium page includes a visible per-trip option, but checkout for that plan is still marked "Coming soon".
