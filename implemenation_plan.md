# Implementation Plan — Phase 1 (Production MVP)

# Implementation Plan — Phase 1 (Production MVP)

Phase 1 transforms the Phase 0 demo into a **real, publicly launchable product**. Every screen already exists and is visually validated. The work here is entirely about hardening: auth, persistence, real data flows, monetisation infrastructure, analytics, and the polish that makes real users trust and return to a product.

**Prerequisite:** Phase 0 demo shipped and partner aligned (March 2, 2026).

**Target launch window:** Week of March 30, 2026 (4 weeks of build time).

**Builder:** 1 full-stack developer.

**Estimated total effort:** 28–34 working days.

> **Design principle:** No new screens are invented in Phase 1 unless explicitly noted. Every screen was validated in the Lovable prototype and built in Phase 0. The goal is to wire real infrastructure behind them — not redesign anything.
> 

---

# Priority Rationale — What Gets Built First

Phase 1 features are sequenced by a single question: *what is the minimum set of things that must work for a real stranger to sign up, generate a trip, and come back?*

The answer defines four layers, built in order:

1. **Auth & persistence** — Without real accounts and a database, nothing else matters. Users can't save trips, return to them, or share them.
2. **Real AI pipeline** — The Phase 0 generation was a prototype. Phase 1 makes it production-grade: async queue, SSE progress, prompt v2, Haiku fallback, quality validation, and itinerary versioning.
3. **Monetisation infrastructure** — Affiliate links are the only revenue mechanism at launch. They must be real, tracked, and embedded in both the web summary and PDF export.
4. **Growth & retention plumbing** — Auth emails (welcome, share notifications), PostHog analytics, share links, and the SEO-ready landing page are what turn a one-time visitor into a returning user.

Everything else — A/B testing, advanced edit mode, GDPR data export, Sentry error tracking — is real but lower priority. It ships in Phase 1 because the architecture already calls for it, not because it's blocking launch.

---

# Week 1 (March 3–7): Auth, Database & Profile

The single most important week. After this week, a real user can create an account, complete a profile, and have their data persisted to Supabase.

## 1.1 — Supabase Auth Integration (Days 1–2)

Phase 0 skipped auth entirely. Phase 1 adds it with the minimum viable friction: email/password only at launch. Google OAuth is wired but gated behind a feature flag — enable it post-launch once tested.

**Routes to create:**

- `src/app/(auth)/signup/page.tsx` — Email + password form. On success: create Supabase profile row, send welcome email via Resend, redirect to `/onboarding`.
- `src/app/(auth)/login/page.tsx` — Email + password. On success: redirect to `/dashboard`.
- `src/app/(auth)/forgot-password/page.tsx` — Email input, trigger Supabase password reset flow.
- `src/app/(auth)/reset-password/page.tsx` — New password form, consumes Supabase reset token.

**Middleware:** Create `src/middleware.ts` using Supabase's server-side auth helper. Protect all `(app)/*` routes — redirect unauthenticated users to `/login`. Allow `(marketing)/*` and `(auth)/*` without auth.

**Session management:** Use Supabase's `createServerClient` in server components and `createBrowserClient` in client components. Access tokens (15 min), refresh tokens (30 days), auto-refreshed by Supabase client. Store session in `httpOnly` cookie via Supabase's cookie helpers for Next.js.

**UI:** All auth pages use the same `max-w-md mx-auto pt-24` card layout as the onboarding pages. `btn-primary` for submit, `btn-ghost` for secondary actions. Form validation with Zod + react-hook-form. Inline field errors, no toast popups.

**Estimated time:** 2 days

## 1.2 — Database Schema & Migrations (Day 2, parallel)

Run all Prisma migrations to create the production schema defined in the Technical Architecture page. Tables to create: `profiles`, `trips`, `itineraries`, `itinerary_edits`, `experiments`, `experiment_assignments`, `analytics_events`, `affiliate_clicks`.

Enable Row Level Security on `profiles`, `trips`, `itineraries` with the exact policies defined in the Technical Architecture page.

Create a `prisma/seed.ts` that writes the Thomas & Lena demo trip (the Phase 0 fallback itinerary) as a seeded record for the demo account.

**Estimated time:** 3–4 hours (parallel with auth UI)

## 1.3 — Full Onboarding Flow (Day 3)

Phase 0 onboarding was 2 steps and stored data only in Zustand/localStorage. Phase 1 persists it to Supabase and extends to 4 steps.

**Step 1 — "Where are you from?"** (unchanged from Phase 0)

Nationality select + home airport select. Values pre-populated if user navigated back.

**Step 2 — "Your travel style"** (unchanged from Phase 0)

Backpacker / Comfort / Luxury card selection + interest chips.

**Step 3 — "How do you travel?" (NEW)**

Two questions on the same card:

- Activity level: `Low (relaxed pace)` / `Moderate (mix of activity and rest)` / `High (packed schedule)` — 3 full-width cards.
- Languages spoken: multi-select chip group from a list of 20 languages. Helps the AI suggest local experiences that work for the user.

**Step 4 — "Almost there!" (NEW)**

Profile summary card showing all selections with a pencil icon to go back. A large `.btn-primary` labelled "Start Planning" that: saves all profile data to `PATCH /api/v1/profile`, marks `onboarding_completed: true`, and navigates to `/plan`.

**State:** Zustand store still manages in-flight state between steps. On step 4 submit, a single API call writes everything. If the user refreshes mid-flow, rehydrate from the store's `persist` middleware — they don't lose progress.

**Estimated time:** 4–5 hours

## 1.4 — Profile Management Page (Day 3, afternoon)

Create `src/app/(app)/profile/page.tsx`. A settings-style page reachable from the navbar avatar dropdown. Shows all 4 onboarding fields in editable form. A "Save changes" button calls `PATCH /api/v1/profile`. A "Delete account" button (red, at the bottom, requires confirmation modal) calls `DELETE /api/v1/profile` which cascades deletion of all trips and itineraries.

**Estimated time:** 2–3 hours

## 1.5 — Trip Persistence (Day 4–5)

Connect the Quick Plan questionnaire and generation flow to real Supabase persistence.

**When the user submits the questionnaire:**

1. `POST /api/v1/trips` — creates a `trips` row with all intent data from the form. Returns `{ trip_id }`.
2. The trip ID is stored in Zustand store.
3. The generation request fires: `POST /api/v1/trips/:id/generate` — kicks off the async job (see Week 2), returns `{ job_id }`.
4. Client subscribes to `GET /api/v1/trips/:id/generate/status` (SSE) for real-time progress.
5. On completion, SSE emits the itinerary ID. Client navigates to `/trip/:id`.

**Dashboard** now loads real trips from `GET /api/v1/trips` instead of `sampleTrips`. Show an empty state ("No trips yet. Start planning!") with a CTA if no trips exist.

**Trip page** loads from `GET /api/v1/trips/:id` instead of hardcoded sample data.

**Estimated time:** 1.5 days

## Week 1 Total: ~9–11 days (tight but achievable with parallel work)

---

# Week 2 (March 10–14): Production AI Pipeline

The Phase 0 pipeline was synchronous and ran directly in a serverless function with a 30s timeout. Phase 1 makes it production-grade: async, observable, and resilient.

## 2.1 — Async Generation Queue (Day 6–7)

Create `src/lib/queue/` using BullMQ on Upstash Redis.

**Job: `itinerary.generate`**

```tsx
interface GenerateItineraryJob {
  trip_id: string;
  user_id: string;
  profile: UserProfile;
  intent: TripIntent;
  prompt_version: string; // e.g. 'v2'
}
```

The job runs the full pipeline: prompt assembly → Claude Sonnet API call → parallel enrichment (visa + weather) → Zod validation → itinerary versioning → Supabase write.

**SSE endpoint:** `GET /api/v1/trips/:id/generate/status` streams progress events to the client:

```tsx
{ stage: 'route',       message: 'Optimising your route...',     pct: 15 }
{ stage: 'activities',  message: 'Planning daily activities...',  pct: 35 }
{ stage: 'visa',        message: 'Checking visa requirements...', pct: 55 }
{ stage: 'weather',     message: 'Analysing weather patterns...',  pct: 70 }
{ stage: 'budget',      message: 'Calculating your budget...',    pct: 85 }
{ stage: 'done',        message: 'Your trip is ready!',           pct: 100, itinerary_id: '...' }
```

The loading screen in Phase 0 was timer-driven. In Phase 1 it's wired to real SSE events — the steps advance when the pipeline actually advances, not on a fixed 3.5s timer.

**Estimated time:** 2 days

## 2.2 — Prompt Template v2 (Day 7–8)

The Phase 0 prompt was a first draft. Phase 1 ships `v2` incorporating the full prompt engineering research:

**Additions vs v1:**

- **Chain-of-thought route reasoning** — before generating the day-by-day plan, the model explicitly reasons about city ordering (geographic proximity, flight hubs, seasonal timing, visa constraints). This reasoning is prompted but not included in the final JSON output.
- **Few-shot activity examples** — 2 gold-standard activity blocks embedded directly in the system prompt to demonstrate the Travel Pro 7 quality bar.
- **Negative examples** — an explicit "DO NOT produce" section showing a shallow entry and explaining why it fails the standard.
- **Budget enforcement** — explicit instruction to sum all `est_cost_cents` values as it writes each day and stop if approaching the budget ceiling.
- **Traveler interest threading** — instruction to reference the user's specific interests when writing `why` fields. "Interesting temple" is wrong; "Perfect for your interest in Buddhist architecture" is right.

**Temperature:** Lower from 0.7 to 0.4 for more grounded, reliable JSON. The creative variance should come from the destination variety and interest matching, not from randomness.

**Prompt caching:** Use Anthropic's prompt caching on the system prompt prefix (everything before the user-specific context injection). The system prompt (~2,000 tokens) is static across all users — caching it saves ~50% of input token costs.

**Estimated time:** 1.5 days

## 2.3 — Claude Haiku Fallback (Day 8)

For targeted re-generations (adding a single city, regenerating one day's activities after an edit), use `claude-haiku-4-5-20251001` instead of Sonnet. 5× cheaper, fast enough for partial generations where the context is already constrained.

Create `src/lib/ai/model-selector.ts`:

```tsx
export function selectModel(task: GenerationTask): string {
  switch (task) {
    case 'full_itinerary':     return 'claude-sonnet-4-20250514';  // ~$0.09
    case 'city_activities':   return 'claude-haiku-4-5-20251001'; // ~$0.01
    case 'single_day_regen':  return 'claude-haiku-4-5-20251001'; // ~$0.005
    case 'budget_recalc':     return 'claude-haiku-4-5-20251001'; // ~$0.002
  }
}
```

**Estimated time:** 3–4 hours

## 2.4 — Itinerary Validation Layer (Day 9)

Create `src/lib/ai/validator.ts`. A rule-based validator that runs after the LLM returns JSON, before it's written to Supabase. Validation rules:

- **Completeness:** Every activity has all 7 required fields (`name`, `why`, `duration_hours`, `best_time`, `est_cost_cents`, `practical_tip`, `nearby_food`). Any activity missing a field triggers a targeted retry prompt: "Activity N on Day X is missing the `nearby_food` field. Return the corrected activity object only."
- **Budget:** Sum all `est_cost_cents` across flights + accommodation + activities. If >105% of budget, log a warning and note it in `budget_estimate.warning` — do not silently fail or auto-strip activities.
- **Route integrity:** Check that no city appears twice in the route array. Check that route order doesn't have obvious geographic backtracking (same country visited twice with other countries in between) without a noted reason.
- **JSON validity:** If Zod parsing fails, retry the LLM call with the Zod error message appended to the prompt (max 2 retries before failing gracefully and serving a cached fallback).

**Estimated time:** 1 day

## 2.5 — Itinerary Versioning (Day 10)

Wire the `itineraries` table versioning to the edit flow. Every time the user saves an edit:

1. The current active itinerary is kept but `is_active` is set to `false`.
2. A new row is inserted with `version = current + 1`, `is_active = true`.
3. The edit is logged to `itinerary_edits` with `edit_type` and `edit_payload`.

A "Version history" button in the edit mode top bar opens a Radix Dialog showing a list of versions (`v1`, `v2`, etc.) with timestamps and edit descriptions. Clicking a version restores it (creates a new version with that content and marks it active).

**Estimated time:** 4–5 hours

## Week 2 Total: ~8–10 days

---

# Week 3 (March 17–21): Monetisation, Export & Share

## 3.1 — Real Affiliate Link Generation (Day 11)

Create `src/lib/affiliate/link-generator.ts`. Replaces the placeholder affiliate links in the Phase 0 export.

**Skyscanner deep links** (flight legs):

```tsx
// Format: https://www.skyscanner.net/transport/flights/{from}/{to}/{date}/?adults={n}
function buildFlightLink(leg: RouteLeg, travelers: number): string {
  return `https://www.skyscanner.net/transport/flights/
    ${leg.from_iata}/${leg.to_iata}/
    ${formatDate(leg.departure_date, 'YYMMDD')}/
    ?adults=${travelers}&ref=travel-pro`;
}
```

[**Booking.com](http://Booking.com) deep links** (accommodation, per city):

```tsx
// Format: https://www.booking.com/searchresults.html?ss={city}&checkin={date}&checkout={date}&group_adults={n}
function buildHotelLink(city: CityStop, travelers: number): string {
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city.city)}
    &checkin=${city.arrival_date}&checkout=${city.departure_date}
    &group_adults=${travelers}&aid=TRAVEL_PRO_AID`;
}
```

**GetYourGuide deep links** (activities):

```tsx
// Format: https://www.getyourguide.com/s/?q={city}+{activity}
function buildActivityLink(city: string, activity: string): string {
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(`${city} ${activity}`)}&partner_id=TRAVEL_PRO_ID`;
}
```

**Affiliate click tracking:** Every link in the app goes through `GET /api/v1/affiliate/redirect?provider=...&itinerary_id=...&type=...&dest=...` which logs to `affiliate_clicks`, then issues a 302 redirect to the partner URL. This gives us a complete picture of which cities and activities drive the most booking intent.

**Estimated time:** 1 day

## 3.2 — Production PDF Export (Day 12)

The Phase 0 PDF was a functional prototype. Phase 1 makes it production-grade.

**Client-side PDF** (`@react-pdf/renderer`) — downloaded directly by the user from the summary page. Structure:

- **Cover page:** Trip title, dates, route summary (city → city → city), Travel Pro branding (teal header bar)
- **Route map:** Mapbox Static Images API PNG (`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/...`). Embed as a base64 image in the PDF.
- **Day-by-day table:** Compact 3-column table (Day | City | Activities). Activities listed as comma-separated names. Travel days shown with ✈ icon.
- **Budget breakdown table:** Category | Estimated Cost | % of Budget.
- **Visa checklist:** Country | Requirement | Max Stay | Apply By.
- **Weather summary:** City | Month | Avg Temp | Conditions | Notes.
- **Booking links section:** Per leg, a row with "✈ [Tokyo → Osaka] — Search on Skyscanner" and "🏨 [Tokyo, 4 nights] — Search on [Booking.com](http://Booking.com)" with the full affiliate URLs printed as clickable links.
- **Footer:** "Generated by Travel Pro — [travelpro.app](http://travelpro.app)" + generation date + page numbers.

**Server-side PDF** (for share links): When a share link is opened and the user clicks "Download PDF", the server generates the PDF using the same `@react-pdf/renderer` pipeline server-side in a Next.js API route. Cached in Supabase Storage for 24h.

**Estimated time:** 1.5 days

## 3.3 — Share Links (Day 13)

Create a public itinerary view accessible without authentication.

**Share link format:** `https://travelpro.app/share/{share_token}` where `share_token` is a 12-character URL-safe random string stored on the `trips` table.

**`GET /api/v1/trips/shared/:token`** — public endpoint. Returns trip + active itinerary JSON. No auth required. Rate-limited to 60 req/min per IP.

**`src/app/share/[token]/page.tsx`** — a read-only version of the itinerary view. Same map + timeline layout, but no edit button and a prominent "Plan your own trip" CTA banner at the top in teal. This banner is the growth flywheel — every person who receives a shared itinerary sees it.

**Share button behaviour** (already in Phase 0 UI): clicking "Share Link" generates a `share_token` (if one doesn't exist) via `GET /api/v1/trips/:id/share`, then copies `https://travelpro.app/share/{token}` to clipboard with a toast notification.

**Estimated time:** 1 day

## 3.4 — Welcome & Share Notification Emails (Day 13–14)

Create email templates using React Email (`src/lib/email/templates/`).

**Welcome email** — triggered on signup:

- Subject: "Welcome to Travel Pro — your first trip is waiting"
- Body: Warm welcome + 1-line value prop + large "Start Planning" CTA button linking to `/plan`.
- Sender: `hello@travelpro.app` via Resend.

**Itinerary ready email** — triggered when generation job completes:

- Subject: "Your [Destination] itinerary is ready ✈"
- Body: Trip summary (cities, dates, budget) + "View Itinerary" CTA + "Download PDF" secondary CTA.

**Shared itinerary email** (future, wired but not triggered yet) — for when sharing is explicitly emailed to a travel companion. Prepare the template now.

**Estimated time:** 4–5 hours

## Week 3 Total: ~7–8 days

---

# Week 4 (March 24–28): Analytics, Edit Mode, GDPR & Launch Polish

## 4.1 — PostHog Analytics Integration (Day 15–16)

Install and configure PostHog across the entire application.

**Client-side:** `posthog-js` initialised in `src/app/providers.tsx` with the PostHog project API key. Auto-capture page views. Identify users on login: `posthog.identify(user.id, { nationality, travel_style, created_at })`.

**Custom events to instrument:**

```tsx
// Every event follows: posthog.capture(event_name, properties)

// Acquisition
'landing_page_viewed'           // { referrer, utm_source }
'signup_started'                // { source: 'cta' | 'nav' }
'signup_completed'              // { method: 'email' }

// Activation
'onboarding_step_completed'     // { step: 1 | 2 | 3 | 4 }
'profile_completed'             // { travel_style, interest_count }
'questionnaire_started'         //
'questionnaire_completed'       // { region, duration_days, budget_eur }
'itinerary_generation_started'  // { trip_id, country_count }
'itinerary_generation_completed'// { trip_id, duration_ms, prompt_version }

// Engagement
'itinerary_viewed'              // { trip_id, city_count }
'city_clicked_on_map'           // { city_name }
'day_card_expanded'             // { day_number, city }
'sidebar_tab_switched'          // { tab: 'visa' | 'weather' | 'budget' }
'itinerary_edit_started'        //
'city_removed'                  // { city_name, days_removed }
'days_adjusted'                 // { city_name, delta }

// Conversion
'pdf_export_clicked'            // { trip_id }
'share_link_created'            // { trip_id }
'share_link_copied'             //
'affiliate_link_clicked'        // { provider, type, city } — via redirect endpoint

// Retention
'second_trip_started'           // fires when user creates trip #2
'returning_user_session'        // fires when auth'd user starts a new session >24h later
```

**Server-side events** (via PostHog Node client, for accuracy on critical events): `itinerary_generation_completed`, `pdf_export_clicked`, `affiliate_link_clicked`. These cannot be blocked by ad blockers.

**Estimated time:** 1.5 days

## 4.2 — Full Edit Mode (Day 16–17)

Phase 0 edit mode had working city cards but no real persistence — the "Save Changes" button just navigated back. Phase 1 wires it to real re-generation.

**Edit actions and their backend calls:**

| Edit action | Backend call | LLM used? |
| --- | --- | --- |
| Adjust days for a city | `PATCH /api/v1/trips/:id/itinerary`  • `edit_type: 'adjust_days'` | No — recalculate dates + budget programmatically |
| Remove a city | Same + `edit_type: 'remove_city'` | No — splice city from route, recalculate |
| Reorder cities | Same + `edit_type: 'reorder_cities'` | No — reorder array, recalculate |
| Add a new city | Same + `edit_type: 'add_city'` | Yes (Haiku) — generate activities for new city only |
| Regenerate a day | Same + `edit_type: 'regenerate_activities'` | Yes (Haiku) — regen activities for one day |

**Budget recalculation:** When days change, recalculate accommodation and local transport estimates proportionally. Flights only change when cities change — flag them with a `budget_estimate.flights_may_vary: true` note.

**Reorder drag-and-drop:** Implement with `dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`). The city list in edit mode becomes a `SortableContext`. On drag end, fire the `reorder_cities` edit action.

**Estimated time:** 2 days

## 4.3 — GDPR Compliance (Day 18)

**Cookie consent banner:** Build a lightweight bottom-of-screen banner that appears on first visit. Two buttons: "Accept all" and "Manage preferences". On accept, initialise PostHog and any future analytics. On reject, PostHog is not initialised. Store consent decision in a `travel_pro_consent` cookie (1-year expiry).

**Privacy policy page:** Create `src/app/(marketing)/privacy/page.tsx`. Plain-language description of: what data is collected (profile, trips, itineraries, analytics events, affiliate clicks), why (to provide the service, improve quality, earn affiliate revenue), retention periods (account data until deletion, analytics events 12 months), third-party processors (Supabase, Vercel, Anthropic, PostHog, Resend, Mapbox), and how to request deletion.

**Data export:** A "Download my data" button in `/profile/settings`. Calls `GET /api/v1/profile/export` which returns a JSON file containing the user's profile, all trips, and all itineraries. No analytics events exported (operational data, not personal in the GDPR sense).

**Account deletion:** The "Delete account" flow in profile settings. Shows a confirmation modal listing what will be deleted. On confirm: cascading Supabase deletion via `DELETE /api/v1/profile`, clears Redis session, signs the user out.

**Estimated time:** 1 day

## 4.4 — Error Tracking with Sentry (Day 18, parallel)

Install `@sentry/nextjs`. Wrap the root layout with Sentry's error boundary. Configure DSN from environment variables. Alert rule: P0 page if error rate exceeds 5% of requests in any 5-minute window.

**Estimated time:** 2–3 hours

## 4.5 — SEO & Landing Page Polish (Day 19)

The Phase 0 landing page is a demo landing page. Phase 1 makes it production-ready for search traffic.

**Meta tags:** Add `title`, `description`, `og:image`, `og:title`, `og:description`, `twitter:card` to the root layout and every public page. The OG image is a static 1200×630 PNG of the itinerary view (generated once, stored in public/).

**Structured data:** Add `WebApplication` and `SoftwareApplication` JSON-LD to the landing page. This helps Google understand what Travel Pro is and can earn a rich snippet.

**Landing page additions** (not a redesign — additive to the Phase 0 design):

- A fourth feature card added to the 3-card grid: 🧳 "Zero Throwaway Work — every edit refines your plan, builds on the last version"
- A minimal social proof section below "How It Works": a quote in a blockquote card attributed to "Thomas, Leipzig — 3-week Asia trip" (can be founder-written until real reviews exist)
- A "Trusted by" logo strip (placeholder travel-related logos or testimonial avatars)

**robots.txt + sitemap.xml:** Generate via `next-sitemap`. Include all marketing pages. Exclude `/api/*`, `/share/*`.

**Estimated time:** 1 day

## 4.6 — Rate Limiting (Day 19–20)

Create `src/middleware.ts` (extend the existing auth middleware). Use Upstash Redis sliding window counters.

**Limits to enforce:**

- Itinerary generation: 5 per hour per user (LLM cost protection)
- General API: 100 requests/min per authenticated user
- Unauthenticated endpoints: 30 requests/min per IP
- Share link views: 60 requests/min per IP

Return `429 Too Many Requests` with a `Retry-After` header and a user-friendly error message: "You've generated 5 itineraries this hour. New generations will be available in 23 minutes."

**Estimated time:** 4–5 hours

## 4.7 — E2E Test Suite (Day 20)

Create Playwright tests for the two critical journeys. These run in CI on every PR against a Vercel preview deployment.

**Journey 1: Sign up → Generate → Export**

```
1. Navigate to / (landing page)
2. Click "Start Planning" → redirected to /signup
3. Fill email + password → submit
4. Complete 4-step onboarding (nationality: DE, style: comfort, level: moderate, languages: DE+EN)
5. Complete 6-card questionnaire (Asia, 28 days, €10,000, Cultural, 2 travelers)
6. Wait for SSE completion (timeout: 60s)
7. Assert itinerary view loaded with at least 1 city card visible
8. Click "Export" → navigate to summary page
9. Click "Download PDF" → assert download triggered
10. Assert at least one Skyscanner link is present in the booking section
```

**Journey 2: Login → Edit → Share**

```
1. Login with test account
2. Navigate to existing trip
3. Click "Edit" → enter edit mode
4. Remove one city → click Save
5. Assert itinerary reloaded with one fewer city
6. Click "Share Link" → assert toast shows "Link copied"
7. Navigate to /share/{token} (without auth)
8. Assert itinerary view renders correctly
9. Assert "Plan your own trip" banner is visible
```

**Estimated time:** 1 day

## Week 4 Total: ~8–10 days