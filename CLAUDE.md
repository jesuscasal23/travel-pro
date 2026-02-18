# Travel Pro — Claude Code Guide

## Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind v4 — design tokens in `src/app/globals.css` via `@theme inline` (no `tailwind.config.ts`)
- **State**: Zustand 5 with `persist` middleware → localStorage (`src/stores/useTripStore.ts`)
- **AI**: Anthropic SDK (`claude-sonnet-4-20250514`) → `src/lib/ai/pipeline.ts`
- **DB**: Prisma + Supabase PostgreSQL (`prisma/schema.prisma`)
- **Maps**: MapLibre GL / react-map-gl v8 (open-source, not Mapbox GL)
- **Testing**: Vitest (unit) + Playwright (e2e, 60s timeout for AI generation)

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Vitest unit tests (also runs on pre-commit via husky)
npm run test:e2e     # Playwright e2e tests (requires dev server running)
npm run lint         # ESLint
```

## Project Structure
```
src/
├── app/
│   ├── (marketing)/         # Public pages — unauthenticated Navbar wrapper
│   │   └── page.tsx         # Landing page
│   ├── (auth)/              # Phase 1: signup/login/forgot-password (not yet built)
│   ├── onboarding/          # 2-step profile form (Phase 1: 4-step)
│   ├── dashboard/           # Trip list
│   ├── plan/                # 6-card questionnaire + AI generation loading
│   ├── trip/[id]/
│   │   ├── page.tsx         # 40/60 split: sticky map + day-by-day timeline
│   │   ├── edit/page.tsx    # City cards, day stepper, drag-drop, floating save bar
│   │   └── summary/page.tsx # Route/budget/visa/weather tabs + PDF export + share
│   └── api/generate/route.ts # POST: Zod validation → AI pipeline → Itinerary JSON
├── components/
│   ├── ui/                  # Button, Card, Chip, Badge, ProgressBar, LoadingSpinner, Toast
│   ├── map/RouteMap.tsx     # MapLibre (always dynamic import, ssr: false)
│   └── export/PDFDownloadButton.tsx
├── lib/
│   ├── ai/
│   │   ├── pipeline.ts      # generateItinerary(), extractJSON(), parseAndValidate()
│   │   ├── enrichment.ts    # enrichVisa() + enrichWeather() (Open-Meteo + Redis cache)
│   │   └── prompts/v1.ts    # SYSTEM_PROMPT_V1, assemblePrompt()
│   ├── db/prisma.ts         # Lazy-init PrismaClient (avoids build-time crash)
│   ├── animations.ts        # slideVariants, fadeUp, simpleFadeUp (Framer Motion)
│   └── export/pdf-generator.tsx
├── stores/useTripStore.ts   # Single Zustand store for all app state
├── types/index.ts           # All TypeScript types (CityStop, TripDay, Itinerary, etc.)
├── data/sampleData.ts       # Demo: Thomas & Lena's Asia trip (22 days, €10k, 7 cities)
└── hooks/useItinerary.ts    # Returns store itinerary OR sampleFullItinerary fallback
```

## Key Patterns

### Next.js 16 Dynamic Params (client components)
```tsx
// MUST use React.use() — params is a Promise in Next.js 16
const { id } = use(params)  // params: Promise<{ id: string }>
```

### MapLibre (SSR-safe)
```tsx
// Always dynamic-import MapLibre to avoid SSR crash
const RouteMap = dynamic(() => import('@/components/map/RouteMap'), { ssr: false })
// Import from react-map-gl/mapbox NOT react-map-gl
```

### Zustand Store Shape
```ts
// Persisted fields (explicit whitelist): nationality, homeAirport, travelStyle,
// interests, region, dateStart, dateEnd, flexibleDates, budget, vibe, travelers,
// currentTripId, itinerary
// Excluded from persist: planStep, generationStep, isGenerating
```

### All Trip Pages Use the Fallback Hook
```tsx
const itinerary = useItinerary() // store data OR sampleFullItinerary — never null
```

## Styling

### Design Tokens (CSS variables via `@theme inline`)
| Token | Value | Tailwind class |
|-------|-------|---------------|
| `--primary` | teal `#0D7377` | `bg-primary`, `text-primary` |
| `--accent` | coral `#E85D4A` | `bg-accent`, `text-accent` |
| `--shadow-card-hover` | `0 4px 16px rgba(0,0,0,0.12)` | `hover:shadow-[var(--shadow-card-hover)]` |

### Component Classes (in `@layer components`)
- `.card-travel` — card with shadow
- `.btn-primary` / `.btn-ghost` — button styles
- `.chip` / `.chip-selected` — chip styles
- `.badge-success` / `.badge-warning` / `.badge-info`

### Dark Mode
- Toggle adds `dark` class to `<html>` via ThemeToggle
- Inline script in root layout prevents flash on load

## Types (all in `src/types/index.ts`)
```ts
CityStop     { id, city, country, lat, lng, days, countryCode }
TripDay      { day, date, city, activities: DayActivity[], isTravel? }
DayActivity  { name, category, icon, why, duration, tip?, food?, cost? }
Itinerary    { route: CityStop[], days: TripDay[], budget, visaData, weatherData }
UserProfile  { nationality, homeAirport, travelStyle, interests }
TripIntent   { id, region, dateStart, dateEnd, flexibleDates, budget, vibe, travelers }
```

## AI Pipeline (`src/lib/ai/pipeline.ts`)
1. `assemblePrompt(profile, intent)` → system prompt with user context
2. Claude Sonnet call (maxTokens: 8000, temperature: 0.7)
3. `extractJSON()` strips markdown fences → `parseAndValidate()` via Zod
4. Parallel `enrichVisa()` + `enrichWeather()` → returns `Itinerary`

**Phase 0 limits**: visa data hardcoded for German passport (JP/VN/TH) only.

**Phase 1 model strategy** (not yet implemented):
- Full itinerary: `claude-sonnet-4-20250514`
- Partial regen (city, single day): `claude-haiku-4-5-20251001`

## API Route (`POST /api/generate`)
- Zod validates `{ profile, tripIntent }` before touching AI
- Rate limited: 10 req/min per IP via Upstash Redis sliding window
- Redis client lazy-initialized — never instantiate at module scope

## Database (Prisma + Supabase)
```
profiles    { id, nationality, homeAirport, travelStyle, interests[] }
trips       { id, profileId, region, dateStart, dateEnd, budget, vibe, travelers }
itineraries { id, tripId, data: Json }  ← full Itinerary object
```
Phase 1 adds: `itinerary_edits`, `experiments`, `analytics_events`, `affiliate_clicks` + RLS policies.

## Required Env Vars
```
ANTHROPIC_API_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```
See `.env.local.example` for full list.

## Phase Status
- **Phase 0** (demo): Complete — all UI screens built, AI pipeline working, sample data seeded
- **Phase 1** (production MVP): Starts March 3, target March 30, 2026
  - Week 1: Supabase Auth, DB migrations, extended onboarding, trip persistence
  - Week 2: Async queue (BullMQ), SSE progress, prompt v2, Haiku fallback, versioning
  - Week 3: Real affiliate links (Skyscanner/Booking.com/GetYourGuide), production PDF, share links, Resend emails
  - Week 4: PostHog analytics, full edit mode, GDPR, Sentry, SEO, rate limiting

## Sample Data (demo trip)
`src/data/sampleData.ts` — Thomas & Lena's Asia trip:
- 7 cities: Tokyo, Kyoto, Hanoi, Ha Long Bay, Bangkok, Chiang Mai, Phuket
- 22 days, €10,000 budget, comfort style, cultural interests
- Exports: `sampleFullItinerary`, `sampleTrips`, `airports`, `nationalities`, `regions`, `interestOptions`

## CSP / Security Headers
Defined in `next.config.ts`. Key notes:
- `script-src unsafe-inline unsafe-eval` required by Next.js App Router
- `worker-src blob` required by MapLibre GL Web Workers
- Add new external domains to `connect-src` before using any new APIs
