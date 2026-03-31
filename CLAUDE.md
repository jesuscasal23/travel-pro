# Fichi — Claude Code Guide

> Full reference (project structure, API routes, DB models, env vars): `docs/reference.md`

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind v4 — design tokens in `src/app/globals.css` via `@theme inline` (no `tailwind.config.ts`)
- **State**: Zustand 5 with `persist` middleware → localStorage (`src/stores/useTripStore.ts`)
- **AI**: Anthropic SDK — Haiku (`claude-haiku-4-5-20251001`) for activity discovery per city
- **DB**: Prisma 7 + Supabase PostgreSQL (`prisma/schema.prisma`, config in `prisma.config.ts`)
- **Auth**: Supabase Auth (email/password) + SSR middleware
- **Maps**: MapLibre GL / react-map-gl v8 (open-source, not Mapbox GL)
- **Flights**: SerpApi (Google Flights) — `src/lib/flights/`
- **Email**: Resend + React Email — `src/lib/email/`
- **Analytics**: PostHog (EU region, consent-gated) + Sentry

## Commands

```bash
npm run dev            # Start dev server
npm run build          # prisma generate && prisma migrate deploy && next build
npm test               # Vitest unit tests
npm run test:e2e       # Playwright e2e (requires dev server)
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm run format         # Prettier
npm run db:migrate     # prisma migrate dev (create new migration)
npm run db:seed        # Prisma db seed
npm run db:studio      # Prisma Studio GUI
```

## Database Migrations (IMPORTANT)

**When modifying `prisma/schema.prisma`, ALWAYS run immediately after:**

```bash
npx prisma migrate dev --name describe_the_change
```

**Never use `prisma db push`** — causes drift between local and production.

## Key Patterns

### Import Conventions

Always import from canonical locations — no re-export shims:

```ts
import { prisma } from "@/lib/core/prisma";
import { createLogger } from "@/lib/core/logger";
import { findActiveItinerary } from "@/lib/features/trips/itinerary-service";
import { getProfileByUserId } from "@/lib/features/profile/profile-service";
import { validate, destinationStepSchema } from "@/lib/forms/schemas";
// Within same feature folder: use relative imports
```

### Frontend Data Hooks

- React Query owns all server state — hooks live in `src/hooks/api/` organized by feature folder (`trips/`, `profile/`, `flights/`, etc.)
- One hook file per use case: e.g. `src/hooks/api/trips/useTrip.ts`
- Cross-feature query keys in `src/hooks/api/keys.ts`
- Zustand for local UI/draft state only, not server data

### Version-Specific Gotchas

- **Next.js 16**: `params` is `Promise<{...}>` in client components — `const { id } = use(params)`
- **Zod v4**: `z.record()` requires 2 args: `z.record(z.string(), z.unknown())`
- **Prisma v7**: datasource `url` in `prisma.config.ts` (not schema.prisma)
- **MapLibre**: import from `react-map-gl/maplibre`; always `dynamic(..., { ssr: false })`
- **Prisma JSON**: always double-cast: `data as unknown as Itinerary`

### Lazy Initialization

Prisma, Redis, Resend, Anthropic — all lazy-init to avoid build-time crashes.

### Guest vs Auth

`/plan` and `/trip` are public (guests can generate/view). `/profile` is protected. Other app routes are auth-aware (show sign-in prompts inline).

## Types (all in `src/types/index.ts`)

```ts
CityStop     { id, city, country, lat, lng, days, countryCode, iataCode? }
TripDay      { day, date, city, activities: DayActivity[], isTravel?, travelFrom?, travelTo? }
DayActivity  { name, category, icon, why, duration, tip?, food?, cost? }
TripBudget   { flights, accommodation, activities, food, transport, total, budget }
Itinerary    { route: CityStop[], days: TripDay[], budget, visaData, weatherData, flightLegs? }
TripIntent   { id, tripType?, region, destination?, dateStart, dateEnd, budget, travelers }
TravelStyle  = "backpacker" | "comfort" | "luxury"
TripType     = "single-city" | "multi-city"
```

## Itinerary Build Pipeline

`TripContextValue.itinerary` is `Itinerary | null` — sub-pages must handle null. `TripNotFound` only for 404/403 on the trip record itself.

**No AI for route/skeleton.** User picks cities; skeleton built deterministically in `buildRouteFromCities()`.

1. **Skeleton** (inline, `POST /api/v1/trips`): client sends `{ route, days: [] }` as `initialItinerary`, persisted in one transaction.
2. **Flight prefetch** (non-blocking): SerpApi per leg → `itinerary.flightOptions`.
3. **Activity discovery** (client-triggered): Claude Haiku via `useDiscoverActivities`. maxTokens 4,000, temp 0.7.
4. **Enrichment** (parallel, client-triggered): `enrichVisa()` + `enrichWeather()` (Open-Meteo + Redis 7d cache).

## Styling

Tokens in `src/app/globals.css` (`@theme inline`). Key tokens:

| Token             | Value           | Tailwind class     |
| ----------------- | --------------- | ------------------ |
| `--primary`       | teal `#0D7377`  | `bg-primary`       |
| `--accent`        | coral `#E85D4A` | `bg-accent`        |
| `--brand-primary` | blue `#2563ff`  | `bg-brand-primary` |
| `--color-navy`    | `#1b2b4b`       | `bg-navy`          |

Components: `Button` (8 variants), `Card`, `Badge`, `Tabs`, `Modal`, `Toast`, `AlertBox`, `Combobox`.
CSS utilities: `.card-travel`, `.btn-primary`, `.btn-ghost`.
ESLint rule `travel-pro/no-hardcoded-colors` — always use tokens, never raw hex in className.
Dark mode: `dark` class on `<html>` via ThemeToggle.

## Itinerary Versioning

1-to-many (Trip → Itinerary). Never `upsert { where: { tripId } }` — tripId is not unique.
