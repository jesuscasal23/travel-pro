# Travel Pro — Claude Code Guide

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind v4 — design tokens in `src/app/globals.css` via `@theme inline` (no `tailwind.config.ts`)
- **State**: Zustand 5 with `persist` middleware → localStorage (`src/stores/useTripStore.ts`)
- **AI**: Anthropic SDK — Haiku (`claude-haiku-4-5-20251001`) for generation, Sonnet for full regen
- **DB**: Prisma 7 + Supabase PostgreSQL (`prisma/schema.prisma`, config in `prisma.config.ts`)
- **Auth**: Supabase Auth (email/password) + SSR middleware
- **Maps**: MapLibre GL / react-map-gl v8 (open-source, not Mapbox GL)
- **Flights**: SerpApi (Google Flights) for price optimization (`src/lib/flights/`)
- **Email**: Resend + React Email templates (`src/lib/email/`)
- **Analytics**: PostHog (EU region, consent-gated) + Sentry error tracking
- **Testing**: Vitest (unit) + Playwright (e2e)

## Commands

```bash
npm run dev            # Start dev server
npm run build          # prisma generate && prisma migrate deploy && next build
npm test               # Vitest unit tests (pre-commit via husky)
npm run test:e2e       # Playwright e2e (requires dev server)
npm run lint           # ESLint
npm run db:migrate     # prisma migrate dev (create new migration)
npm run db:seed        # Prisma db seed
npm run db:studio      # Prisma Studio GUI
npm run db:generate    # Prisma generate client
```

## Database Migrations (IMPORTANT)

**When modifying `prisma/schema.prisma`, ALWAYS create a migration immediately after:**

```bash
npx prisma migrate dev --name describe_the_change
```

This generates a versioned SQL file in `prisma/migrations/` that MUST be committed with the schema change. Production applies migrations automatically via `prisma migrate deploy` in the build script.

**Never use `prisma db push`** — it syncs the schema without creating migration history, causing drift between local and production.

## Project Structure

```
src/
├── app/
│   ├── (marketing)/           # Landing + privacy (public, Navbar wrapper)
│   ├── (auth)/                # signup, login, forgot-password, reset-password
│   ├── (app)/                 # Mobile-first app shell (430px container layout)
│   │   ├── get-started/       # Onboarding entry (mobile landing + advantage/vibe/interests/budget/rhythm)
│   │   ├── home/              # Dashboard: next trip, info cards, departure tasks
│   │   ├── trips/             # Trip list (real API data via useTrips)
│   │   ├── bookings/          # Travel wallet (mock — future feature)
│   │   └── profile/           # Settings hub: auth-aware, sign out, travel DNA
│   ├── dashboard/             # Redirect → /home (backwards compatibility)
│   ├── plan/                  # Multi-step questionnaire + SSE generation
│   ├── trip/[id]/             # 40/60 map+timeline, edit (drag-drop), summary (tabs+share+PDF)
│   ├── share/[token]/         # Public read-only view + growth CTA
│   ├── auth/callback/         # Supabase OAuth callback
│   └── api/
│       ├── generate/          # Phase 0 routes (direct + select-route)
│       ├── health/            # Health check
│       └── v1/                # REST API: trips, profile, affiliate
├── components/
│   ├── ui/                    # Button, Card, Badge, Tabs, Modal, Toast, Combobox variants, AlertBox, ProgressBar, BottomNav
│   ├── auth/                  # Auth form styles + ServerErrorAlert
│   ├── map/                   # RouteMap (MapLibre, dynamic import) + fallback
│   ├── export/                # PDFDownloadButton
│   ├── trip/                  # BudgetBreakdown, TripNotFound, plan-view/ (PlanViewLayout, tabs)
│   ├── Navbar.tsx, Providers.tsx, ThemeToggle.tsx, CookieConsent.tsx
│   └── TravelStylePicker.tsx, WorldMapSVG.tsx
├── lib/
│   ├── ai/                    # pipeline, enrichment
│   │   └── prompts/           # main (v1.ts), single-city, route-selector, city-activities
│   ├── api/                   # helpers (auth guards, apiHandler), errors
│   ├── core/                  # prisma, logger, request-context, abort (canonical locations)
│   ├── features/              # Domain services (canonical location for all business logic)
│   │   ├── trips/             # itinerary-service, trip-query, trip-collection, trip-edit, trip-share, city-activity, flight-optimization, flight-search, query-shapes, schemas, serializer
│   │   ├── generation/        # trip-generation-service, route-selection, city-discovery, schemas
│   │   ├── profile/           # profile-service, schemas, query-shapes, serializer, interests, pace
│   │   ├── enrichment/        # schemas, transforms (routes call lib/ai/enrich-* directly)
│   │   ├── affiliate/         # redirect-service, redirect-utils, link-generator, schema
│   │   ├── health/            # health-service
│   │   └── client-errors/     # service, schema
│   ├── forms/                 # Form validation schemas (plan, onboarding, profile)
│   ├── flights/               # serpapi.ts, optimizer.ts, booking-links, iata, city-iata-map, types
│   ├── hotels/                # SerpApi hotel search + types
│   ├── itinerary/             # Shared Zod schemas for itinerary data (cityGeoSchema, itinerarySchema)
│   ├── client/                # Client-side fetch wrapper (apiFetch, SSE parser, error reporting)
│   ├── utils/                 # date, error, country-flags, trip-metadata, derive-city-budget, etc.
│   └── animations.ts          # slideVariants (Framer Motion)
├── stores/useTripStore.ts     # Zustand store (persisted + transient fields)
├── types/index.ts             # All TypeScript types
├── data/                      # cities, nationalities, airports-full, visa-index, travelStyles
├── hooks/                     # api/ (React Query server-state hooks by feature), useCityImage, useInstallPrompt
└── proxy.ts                   # Auth (protects /profile) + rate limiting (Upstash Redis)
```

## Key Patterns

### Import Conventions

Always import from canonical locations — no re-export shims:

```ts
// Core infrastructure — import from @/lib/core/
import { prisma } from "@/lib/core/prisma";
import { createLogger } from "@/lib/core/logger";
import { requestContext } from "@/lib/core/request-context";
import { throwIfAborted } from "@/lib/core/abort";

// Business logic — import from @/lib/features/{domain}/
import { findActiveItinerary } from "@/lib/features/trips/itinerary-service";
import { createTripGenerationStreamResponse } from "@/lib/features/generation/trip-generation-service";
import { getProfileByUserId } from "@/lib/features/profile/profile-service";

// Within the same feature folder, use relative imports:
import { TRIP_ACCESS_SELECT } from "./query-shapes";

// Form schemas — import from @/lib/forms/
import { validate, destinationStepSchema } from "@/lib/forms/schemas";

// API schemas — import directly from the feature that owns them:
import { GenerateTripInputSchema } from "@/lib/features/generation/schemas";
import { FlightSearchInputSchema } from "@/lib/features/trips/schemas";
```

### Frontend Data Hooks

- Treat React Query as the default owner for frontend server state.
- Keep server-state hooks under `src/hooks/api/`.
- Organize `src/hooks/api/` by feature folder, for example `trips/`, `profile/`, `admin/`, `enrichment/`, `flights/`, `auth/`, `route-selection/`.
- Prefer one hook file per query or mutation use case, for example `src/hooks/api/trips/useTrip.ts` or `src/hooks/api/profile/useSaveProfile.ts`.
- Keep feature-local shared helpers near the hooks that use them, for example `shared.ts` files for request helpers or shared types.
- Keep cross-feature query keys centralized in `src/hooks/api/keys.ts`.
- Do not add new flat server-state hook files directly under `src/hooks/api/` other than shared entry points such as `index.ts` and `keys.ts`.
- Use React Query hooks for reads and writes whenever possible: `useQuery`, `useMutation`, `useQueries`, `fetchQuery`, `prefetchQuery`.
- Keep Zustand for local UI or draft state, not as the primary source of truth for server data.

### Next.js 16 Dynamic Params

```tsx
const { id } = use(params); // params: Promise<{ id: string }>
```

### MapLibre (SSR-safe)

```tsx
const RouteMap = dynamic(() => import("@/components/map/RouteMap"), { ssr: false });
// Import from react-map-gl/maplibre (NOT react-map-gl or react-map-gl/mapbox)
```

### Zustand Store

```ts
// Persisted: onboardingStep, nationality, homeAirport, travelStyle, interests, displayName,
//   tripType, region, destination, destinationCountry, destinationCountryCode,
//   destinationLat, destinationLng, dateStart, dateEnd, flexibleDates, budget,
//   travelers, currentTripId, itinerary
// Transient (NOT persisted): planStep, generationStep, isGenerating
```

### Lazy Initialization

Prisma, Redis, Resend, Anthropic — all lazy-init to avoid build-time crashes when env vars missing.

### Prisma JSON Cast

```ts
data as unknown as Itinerary; // Always double-cast .data fields from DB
```

### Guest vs Auth

`/plan` and `/trip` are public — guests can generate and view. Auth encouraged (not required) via "save your trip" nudge. `/profile` is protected. `/home`, `/trips`, `/discover`, `/bookings` are public but auth-aware (show sign-in prompts inline).

## Types (all in `src/types/index.ts`)

```ts
CityStop     { id, city, country, lat, lng, days, countryCode, iataCode? }
TripDay      { day, date, city, activities: DayActivity[], isTravel?, travelFrom?, travelTo? }
DayActivity  { name, category, icon, why, duration, tip?, food?, cost? }
TripBudget   { flights, accommodation, activities, food, transport, total, budget }
VisaInfo     { country, countryCode, requirement, maxStayDays, notes, icon, label, sourceUrl }
CityWeather  { city, temp, condition, icon }
Itinerary    { route: CityStop[], days: TripDay[], budget, visaData, weatherData, flightLegs? }
UserProfile  { nationality, homeAirport, travelStyle, interests }
TripIntent   { id, tripType?, region, destination?, dateStart, dateEnd, flexibleDates, budget, travelers }
TravelStyle  = "backpacker" | "comfort" | "luxury"
TripType     = "single-city" | "multi-city"
```

## AI Pipeline (`src/lib/ai/`)

1. **Route selection** (multi-city only): Haiku picks cities via `selectRoute()` → `CityWithDays[]`
2. **Prompt assembly**: `assemblePrompt()` or `assembleSingleCityPrompt()` with profile + intent + optional flight skeleton
3. **Claude Haiku call**: maxTokens 10,000 (multi-city) / 4,000 (single-city), temp 0.7, 50s timeout
4. **Parse + validate**: `extractJSON()` strips fences → Zod schema validation
5. **Enrichment** (parallel): `enrichVisa()` (Passport Index static data, 199×227) + `enrichWeather()` (Open-Meteo + Redis 7d cache)
6. **Persist** to Prisma (best-effort, non-blocking)

Content filtering retry: backoff, max 2 retries.

## API Routes

| Route                          | Methods            | Auth                             | Notes                                           |
| ------------------------------ | ------------------ | -------------------------------- | ----------------------------------------------- |
| `/api/generate/select-route`   | POST               | Public (10/min IP)               | Haiku route selection (multi-city)              |
| `/api/health`                  | GET                | None                             | Env check (anthropic, supabase, db)             |
| `/api/v1/trips`                | GET, POST          | GET: auth, POST: optional        | List/create trips                               |
| `/api/v1/trips/[id]`           | GET, PATCH, DELETE | GET: public, PATCH/DELETE: owner | PATCH creates new itinerary version             |
| `/api/v1/trips/[id]/generate`  | POST               | Public                           | SSE stream (route→activities→visa→weather→done) |
| `/api/v1/trips/[id]/optimize`  | POST               | Owner                            | SerpApi flight price optimization               |
| `/api/v1/trips/[id]/share`     | GET                | Owner                            | Generate/return share token + URL               |
| `/api/v1/trips/shared/[token]` | GET                | Public (60/min)                  | Fetch shared itinerary                          |
| `/api/v1/profile`              | GET, PATCH, DELETE | Auth                             | Upsert profile, GDPR account delete             |
| `/api/v1/profile/export`       | GET                | Auth                             | GDPR data export (all user data as JSON)        |
| `/api/v1/affiliate/redirect`   | GET                | Public                           | Log click + 302 redirect (domain whitelist)     |

## Database (5 models in `prisma/schema.prisma`)

- **Profile**: userId (unique), nationality, homeAirport, travelStyle, interests[], activityLevel?, languagesSpoken[], onboardingCompleted
- **Trip**: profileId?, tripType, region, destination?, dateStart, dateEnd, budget, travelers, shareToken?
- **Itinerary**: tripId, data (Json), version, isActive, promptVersion, generationStatus, generationJobId?
- **ItineraryEdit**: itineraryId, editType, editPayload (Json), description?
- **AffiliateClick**: tripId?, provider, clickType, city?, destination?, url, ipHash?

Itinerary versioning: 1-to-many (Trip → Itinerary). Never `upsert { where: { tripId } }` — tripId is not unique.

## Proxy (`src/proxy.ts`)

- **Protected routes**: `/profile` → redirect to `/login?next=...` if unauthenticated
- **Public routes**: `/plan`, `/trip` (guests can generate/view), `/share`, auth pages, `/api/health`, `/get-started`, `/onboarding`, `/home`, `/trips`, `/discover`, `/bookings`
- **Rate limiting** (Upstash Redis sliding window):
  - `/api/v1/trips/*/generate`: 5 req/hour (LLM cost protection)
  - `/api/v1/trips/shared/*`: 60 req/min
  - `/api/v1/*` general: 30 req/min
- Fail-open: requests pass through if Redis unavailable

## Styling

All design tokens live in `src/app/globals.css` — CSS custom properties in `:root` exposed via `@theme inline` for Tailwind v4.

| Token               | Value           | Tailwind class                           |
| ------------------- | --------------- | ---------------------------------------- |
| `--primary`         | teal `#0D7377`  | `bg-primary`, `text-primary`             |
| `--accent`          | coral `#E85D4A` | `bg-accent`, `text-accent`               |
| `--brand-primary`   | blue `#2563ff`  | `bg-brand-primary`, `text-brand-primary` |
| `--color-navy`      | `#1b2b4b`       | `bg-navy`, `text-navy`                   |
| `--color-app-*`     | various         | `bg-app-blue`, `text-app-green`, etc.    |
| `--color-surface-*` | various         | `bg-surface-soft`, `bg-surface-hover`    |

Reusable components: `Button` (8 variants), `Card` (glass/solid/outline), `Badge` (7 variants), `Tabs` (TabList/Tab/TabPanel), `Modal`, `Toast`, `AlertBox`, `Combobox`.
CSS utility classes: `.card-travel`, `.btn-primary`, `.btn-ghost` (for non-React elements like `<Link>`).
ESLint rule `travel-pro/no-hardcoded-colors` flags arbitrary hex values in className — always use tokens.

Dark mode: `dark` class on `<html>` via ThemeToggle + inline script in root layout prevents flash.

## Required Env Vars

```
ANTHROPIC_API_KEY              # AI generation
DATABASE_URL                   # Prisma → Supabase PostgreSQL
NEXT_PUBLIC_SUPABASE_URL       # Supabase client
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase client
SUPABASE_SERVICE_ROLE_KEY      # Server-side auth (account delete)
NEXT_PUBLIC_MAPBOX_TOKEN       # MapLibre tiles
UPSTASH_REDIS_REST_URL         # Rate limiting + weather cache
UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY                 # Transactional email
NEXT_PUBLIC_APP_URL            # Share URLs, email links
NEXT_PUBLIC_POSTHOG_KEY        # Analytics (EU region)
NEXT_PUBLIC_POSTHOG_HOST       # PostHog host
NEXT_PUBLIC_SENTRY_DSN         # Error tracking
SERPAPI_API_KEY                 # Flight optimization (optional)
```

See `.env.local.example` for full list.

## Version Notes

- **Zod v4** (^4.3.6): `z.record()` requires 2 args: `z.record(z.string(), z.unknown())`
- **Prisma v7** (^7.4.0): datasource `url` in `prisma.config.ts` (not schema.prisma). VS Code may show false errors.
- **Next.js 16**: `params` is `Promise<{...}>` in client components — use `React.use(params)`

## CSP / Security Headers

Defined in `next.config.ts` (wrapped with `withSentryConfig`):

- `script-src unsafe-inline` (+ `unsafe-eval` in dev only) + PostHog CDN
- `worker-src blob:` required by MapLibre GL Web Workers
- Add new external domains to `connect-src` before using any new APIs

## Sample Data

`src/data/sampleData.ts` — Thomas & Lena's Asia trip (7 cities, 22 days, €10k, comfort).
Exports: `sampleFullItinerary`, `sampleTrips`, `sampleRoute`, `sampleBudget`, `interestOptions`, `regions`.
Separate data files: `airports-full.ts`, `nationalities.ts`, `cities.ts`, `visa-index.ts`, `travelStyles.ts`.
