# Travel Pro — Claude Code Guide

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind v4 — design tokens in `src/app/globals.css` via `@theme inline` (no `tailwind.config.ts`)
- **State**: Zustand 5 with `persist` middleware → localStorage (`src/stores/useTripStore.ts`)
- **AI**: Anthropic SDK — Haiku (`claude-haiku-4-5-20251001`) for generation, Sonnet for full regen
- **DB**: Prisma 7 + Supabase PostgreSQL (`prisma/schema.prisma`, config in `prisma.config.ts`)
- **Auth**: Supabase Auth (email/password) + SSR middleware
- **Maps**: MapLibre GL / react-map-gl v8 (open-source, not Mapbox GL)
- **Flights**: Amadeus API for price optimization (`src/lib/flights/`)
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
│   ├── (v2-app)/              # Mobile-first app shell (430px container layout)
│   │   ├── get-started/       # v2 onboarding entry (mobile landing)
│   │   ├── onboarding/        # Multi-step onboarding: about-you → preferences → interests → pace → pain-points → summary → signup
│   │   ├── home/              # Dashboard: next trip, info cards, departure tasks
│   │   ├── trips/             # Trip list (real API data via useTrips)
│   │   ├── discover/          # Trending destinations (mock — future feature)
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
│   ├── ui/                    # Button, Card, Chip, Badge, Modal, Toast, AirportCombobox, CityCombobox
│   ├── v2/                    # V2 mobile components: OnboardingShell, ui/ (Button, ProgressBar, BottomNav)
│   ├── auth/                  # Auth form styles + ServerErrorAlert
│   ├── map/                   # RouteMap (MapLibre, dynamic import) + fallback
│   ├── export/                # PDFDownloadButton
│   ├── trip/                  # BudgetBreakdown, TripNotFound, plan-view/ (PlanViewLayout, tabs)
│   ├── Navbar.tsx, Providers.tsx, ThemeToggle.tsx, CookieConsent.tsx
│   └── TravelStylePicker.tsx, WorldMapSVG.tsx
├── lib/
│   ├── ai/                    # pipeline, enrichment
│   │   └── prompts/           # v1, single-city, route-selector
│   ├── api/                   # helpers (auth guards, apiHandler) + schemas (Zod)
│   ├── services/              # itinerary-service (versioning), trip-service (intent, share)
│   ├── db/prisma.ts           # Lazy-init PrismaClient (Proxy pattern)
│   ├── supabase/              # client.ts (browser) + server.ts (SSR cookies)
│   ├── flights/               # amadeus.ts, optimizer.ts, city-iata-map, types
│   ├── affiliate/             # link-generator (Skyscanner/Booking.com/GetYourGuide)
│   ├── email/                 # Resend client + templates (welcome, itinerary-ready, shared)
│   ├── export/                # pdf-generator.tsx (@react-pdf/renderer)
│   ├── utils/                 # date, error, country-flags, trip-metadata, derive-city-budget, etc.
│   └── animations.ts          # slideVariants, fadeUp, simpleFadeUp (Framer Motion)
├── stores/useTripStore.ts     # Zustand store (persisted + transient fields)
├── types/index.ts             # All TypeScript types
├── data/                      # sampleData, cities, nationalities, airports-full, visa-index, travelStyles, generationSteps, v2-mock-data
├── hooks/                     # useItinerary, useAuthStatus, useToast, useScrollSync
└── proxy.ts                   # Auth (protects /profile) + rate limiting (Upstash Redis)
```

## Key Patterns

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

`/plan` and `/trip` are public — guests can generate and view. Auth encouraged (not required) via "save your trip" nudge. `/profile` is protected. `/home`, `/trips`, `/discover`, `/bookings` are public but auth-aware (show sign-in prompts inline). `/dashboard` redirects to `/home`.

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
2. **Prompt assembly**: `assemblePrompt()` (v1/v2) or `assembleSingleCityPrompt()` with profile + intent + optional flight skeleton
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
| `/api/v1/trips/[id]/optimize`  | POST               | Owner                            | Amadeus flight price optimization               |
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

| Token       | Value           | Tailwind class               | Used by |
| ----------- | --------------- | ---------------------------- | ------- |
| `--primary` | teal `#0D7377`  | `bg-primary`, `text-primary` | v1      |
| `--accent`  | coral `#E85D4A` | `bg-accent`, `text-accent`   | v1      |
| `v2-navy`   | `#1b2b4b`       | `bg-v2-navy`, `text-v2-navy` | v2      |
| `v2-orange` | `#f97316`       | `bg-v2-orange`               | v2      |

V1 classes: `.card-travel`, `.btn-primary`, `.btn-ghost`, `.chip`, `.chip-selected`, `.badge-success/.warning/.info`
V2 components: `@/components/v2/ui/Button` (5 variants), `ProgressBar`, `BottomNav`, `OnboardingShell`
V2 tokens defined in `globals.css` `@theme inline` block (lines 93+).

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
AMADEUS_API_KEY                # Flight optimization (optional)
AMADEUS_API_SECRET
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
