# Travel Pro — Backend Improvement Assessment

> Based on a full code audit of the backend.
> Last updated: 2026-02-19 — All 7 actionable items completed. Deferred enrichment architecture shipped.

---

## What's Done Well

The backend is solid for a Phase 1 MVP. A few things stand out positively:

- **Lazy initialization** across all service clients (Prisma, Redis, Resend, Anthropic) is well-executed and prevents build-time crashes when env vars are missing
- **The `apiHandler` wrapper + `ApiError` class** gives consistent error responses across all routes with structured logging baked in
- **Auth guards** (`requireAuth`, `requireProfile`, `requireTripOwnership`) are clean and composable
- **Fail-open resilience** is the right choice at this stage — weather, visa, Redis, DB persist all degrade gracefully without blocking the user
- **The AI pipeline** has clear stages with good timing instrumentation and structured logging
- **Deferred enrichment architecture** keeps generation fast (~5s) by separating core itinerary creation from visa/weather enrichment, which the client fetches in the background
- **Service layer** (`itinerary-service`, `trip-service`) isolates business logic from HTTP concerns and is fully unit-tested
- **Comprehensive test coverage** — 13 test files covering the AI pipeline, utilities, API helpers, schemas, and services

---

## What Was Improved

### 1. ~~Two parallel generation systems with duplicated logic~~ — DONE

Consolidated all generation through the single v1 SSE route (`POST /api/v1/trips/[id]/generate`). Changes:
- **Plan page**: Unified `handleGenerate` — both guest and auth users now create a trip via `POST /api/v1/trips` (anonymous: `profileId: null`), set a partial itinerary in the store, and redirect to `/trip/{id}` where background generation fires via SSE
- **Trip page**: Removed entire guest `/api/generate` branch — all generation goes through the v1 SSE endpoint. Cities passed conditionally (from store route or let pipeline do route selection)
- **Deleted** `/api/generate/route.ts` (Phase 0 generation endpoint) and its integration test
- **Kept** `/api/generate/select-route` (still needed for speculative pre-fetch on the plan page)
- **Middleware**: Updated rate limit to only cover `/api/generate/select-route` (removed `/api/generate` entry)

Additionally, adopted a **deferred enrichment architecture** (commit `01cccdd`):
- `generateCoreItinerary()` returns the core itinerary (route + days + budget) without visa/weather enrichment — this is what the SSE route uses for fast ~5s generation
- `generateItinerary()` runs the full 5-stage pipeline (core + enrich + persist) for use cases that need everything in one call
- Two new lightweight endpoints handle background enrichment after the trip page renders:
  - `POST /api/v1/enrich/visa` — Passport Index static lookup (essentially instant)
  - `POST /api/v1/enrich/weather` — Open-Meteo archive API + Redis cache (7d TTL)

### 2. ~~No service layer — business logic lives in route handlers~~ — DONE

Extracted business logic into two service modules:

**`src/lib/services/itinerary-service.ts`** (5 functions):
- `findActiveItinerary(tripId)` — find current active itinerary
- `createItineraryVersion({...})` — atomic deactivate-old + create-new via `$transaction`
- `createGeneratingRecord({...})` — create "generating" placeholder
- `activateGeneratedItinerary(id, tripId, data)` — atomic activate + deactivate-others
- `markGenerationFailed(id)` — mark generation as failed

**`src/lib/services/trip-service.ts`** (2 functions):
- `tripToIntent(trip)` — DB record → TripIntent domain type
- `ensureShareToken(tripId)` — idempotent get-or-create share token

**Refactored 3 route handlers** to use service calls:
- `trips/[id]/generate/route.ts` — replaced inline DB ops with service calls, SSE stays in route
- `trips/[id]/route.ts` PATCH — replaced inline versioning with `findActiveItinerary` + `createItineraryVersion`
- `trips/[id]/share/route.ts` — replaced inline token logic with `ensureShareToken`, switched to `requireTripOwnership`

### 3. ~~Three different rate limiting approaches~~ — DONE

All rate limiting now runs through the middleware (Upstash Redis sliding window). Removed the lazy-initialized in-route limiter from `/api/generate` and `/api/generate/select-route`, and removed the in-memory Map limiter from `/api/v1/trips/shared/[token]`. Middleware now covers four tiers:
- `/api/v1/trips/*/generate`: 5 req/hour (LLM cost protection)
- `/api/generate/select-route`: 10 req/min
- `/api/v1/trips/shared/*`: 60 req/min
- `/api/v1/*` general: 30 req/min

All rate limiting uses Upstash Redis REST API at the edge (no ioredis needed). Fail-open: if Redis is unavailable, requests pass through. Returns 429 with `Retry-After` header and user-friendly message.

### 4. ~~Dead code adds cognitive load~~ — DONE

Deleted unused code that was never wired into any production path:
- **Deleted** `prompts/v2.ts` — prompt iteration that was never integrated into the pipeline
- **Deleted** `model-selector.ts` + test — multi-model routing logic never imported by pipeline
- **Deleted** `validator.ts` + test — alternative validation approach (pipeline uses Zod directly)
- **Deleted** `Experiment`, `ExperimentAssignment`, `AnalyticsEvent` DB models — schema with no consuming routes
- **Kept** `sendWelcomeEmail()`, `sendItineraryReadyEmail()` — intentionally ready for launch wiring

### 5. ~~No structured logging~~ — DONE

Added `src/lib/logger.ts` — a lightweight `createLogger(module)` factory used across all server-side modules. Features:
- **Log levels**: debug, info, warn, error (configurable via `LOG_LEVEL` env var)
- **Dev format**: `HH:mm:ss.SSS LEVEL [module] message | key=value`
- **Production format**: JSON lines with timestamp, level, module, message, and context fields
- Replaced all `console.log/warn/error` calls in: pipeline, enrichment, API helpers, route handlers, Amadeus, email, affiliate redirect

### 6. ~~The `Json` → `Itinerary` double-cast is a paper cut~~ — DONE

Added `parseItineraryData()` to `src/lib/utils/trip-metadata.ts`. Replaced all `data as unknown as Itinerary` double-casts in the trip page and share page.

### 7. SSE progress stages are simulated

The SSE stream sends events for "route", "activities" with artificial delays — but the actual pipeline runs as one `generateCoreItinerary()` call. The progress events don't reflect real pipeline stages.

**Recommendation:** If real progress tracking is ever needed (e.g., for longer generations or background jobs), refactor the pipeline to emit real events via a callback or event emitter pattern. For now, the simulated stages provide adequate UX feedback for the ~5s generation time.

### 8. ~~No backend unit tests~~ — DONE

Added 13 unit test files covering core backend logic:

**AI Pipeline (5 files):**
- `src/lib/ai/__tests__/pipeline.test.ts` — `extractJSON`, `parseAndValidate` integration tests
- `src/lib/ai/__tests__/pipeline.unit.test.ts` — pipeline unit tests (mocked Anthropic)
- `src/lib/ai/__tests__/enrichment.test.ts` — `enrichVisa`, `enrichWeather` integration tests
- `src/lib/ai/__tests__/enrichment.unit.test.ts` — enrichment unit tests (mocked APIs)
- `src/lib/ai/__tests__/single-city.test.ts` — single-city prompt assembly

**Utilities (4 files):**
- `src/lib/utils/__tests__/derive-city-budget.test.ts` — `parseCostString`, `deriveCityBudgets`
- `src/lib/utils/__tests__/date.test.ts` — `daysBetween`, `addDays`, `formatDateShort`
- `src/lib/utils/__tests__/error.test.ts` — `getErrorMessage`
- `src/lib/utils/__tests__/trip-metadata.test.ts` — `isSingleCity`, `getTripTitle`, `getUniqueCountries`, `getBudgetStatus`

**API Layer (2 files):**
- `src/lib/api/__tests__/helpers.test.ts` — `ApiError`, `validateBody`, `getClientIp`, `apiHandler`, auth guards
- `src/lib/api/__tests__/schemas.test.ts` — `ProfileInputSchema`, `TripIntentInputSchema`, `CityWithDaysInputSchema`

**Services (2 files):**
- `src/lib/services/__tests__/itinerary-service.test.ts` — versioning, activation, failure states
- `src/lib/services/__tests__/trip-service.test.ts` — `tripToIntent`, `ensureShareToken`

---

## Recent Architecture Changes

### Deferred Enrichment (commit `01cccdd`)

The generation pipeline was refactored into a two-phase architecture:

**Phase A — Core generation (SSE route, ~5s):**
1. Assemble prompt (v1 multi-city or single-city)
2. Call Claude Haiku (50s timeout, temp 0.7)
3. Parse + validate with Zod
4. Return immediately → client renders itinerary

**Phase B — Background enrichment (client-initiated, non-blocking):**
5. Client calls `POST /api/v1/enrich/visa` with nationality + route
6. Client calls `POST /api/v1/enrich/weather` with route + dateStart
7. Results injected into the rendered itinerary progressively

This split reduces perceived generation time from ~8–12s to ~5s by deferring the visa lookup and weather API calls to after the core itinerary is displayed.

### Prisma Migrate (commit `0d04b4d`)

Switched from `prisma db push` (schema sync without history) to `prisma migrate dev` (versioned SQL migrations). Production applies migrations via `prisma migrate deploy` in the build script. Migration files live in `prisma/migrations/` and are committed to git.

### Schema Field Removals

- **`vibe` / `TripVibe` enum** (commit `7baf253`) — removed as redundant with `interests[]` + `travelStyle`
- **`name` field on Trip** (commit `79038d7`) — removed from the plan wizard; display name stored on Profile instead

---

## Current API Surface

| Route | Method | Auth | Rate Limit | Type | Purpose |
|-------|--------|------|-----------|------|---------|
| `/api/health` | GET | No | None | JSON | Environment check |
| `/api/generate/select-route` | POST | No | 10/min | JSON | Haiku route selection (multi-city) |
| `/api/v1/trips` | GET | Yes | 30/min | JSON | List user trips |
| `/api/v1/trips` | POST | No | 30/min | JSON | Create trip (guest or auth) |
| `/api/v1/trips/[id]` | GET | No | 30/min | JSON | Fetch trip (public) |
| `/api/v1/trips/[id]` | PATCH | Yes | 30/min | JSON | Edit itinerary (creates new version) |
| `/api/v1/trips/[id]` | DELETE | Yes | 30/min | JSON | Delete trip (cascades) |
| `/api/v1/trips/[id]/generate` | POST | No | 5/hour | SSE | AI generation stream |
| `/api/v1/trips/[id]/optimize` | POST | Yes | 30/min | JSON | Amadeus flight optimization |
| `/api/v1/trips/[id]/share` | GET | Yes | 30/min | JSON | Generate/return share token |
| `/api/v1/trips/shared/[token]` | GET | No | 60/min | JSON | Public shared trip view |
| `/api/v1/enrich/visa` | POST | No | 30/min | JSON | Background visa enrichment |
| `/api/v1/enrich/weather` | POST | No | 30/min | JSON | Background weather enrichment |
| `/api/v1/profile` | GET | Yes | 30/min | JSON | Fetch profile |
| `/api/v1/profile` | PATCH | Yes | 30/min | JSON | Update profile (upsert) |
| `/api/v1/profile` | DELETE | Yes | 30/min | JSON | GDPR account delete |
| `/api/v1/profile/export` | GET | Yes | 30/min | JSON | GDPR data export |
| `/api/v1/affiliate/redirect` | GET | No | 30/min | 302 | Log click + redirect |

**18 endpoints total** (was 16 before enrichment routes).

---

## Current Database Schema (5 models)

```
Profile        — userId (unique), nationality, homeAirport, travelStyle, interests[],
                 activityLevel?, languagesSpoken[], onboardingCompleted
Trip           — profileId?, tripType, region, destination?, destinationCountry?,
                 destinationCountryCode?, dateStart, dateEnd, flexibleDates, budget,
                 travelers, shareToken?
Itinerary      — tripId, data (Json), version, isActive, promptVersion,
                 generationStatus, generationJobId?
ItineraryEdit  — itineraryId, editType, editPayload (Json), description?
AffiliateClick — tripId?, provider, clickType, city?, destination?, url,
                 userId?, sessionId?, ipHash?
```

Removed in Phase 1 cleanup: `Experiment`, `ExperimentAssignment`, `AnalyticsEvent` (no consuming routes).

---

## Current Backend File Structure

```
src/lib/
├── ai/
│   ├── pipeline.ts              # 5-stage generation (prompt → Claude → parse → enrich → persist)
│   ├── enrichment.ts            # Visa (Passport Index) + Weather (Open-Meteo + Redis)
│   └── prompts/
│       ├── v1.ts                # Multi-city prompt template
│       ├── single-city.ts       # Single-city prompt template
│       └── route-selector.ts    # Haiku city selection (Stage A)
├── api/
│   ├── helpers.ts               # apiHandler, ApiError, auth guards, validation
│   └── schemas.ts               # Zod request/response schemas
├── services/
│   ├── itinerary-service.ts     # Versioning, activation, generation state
│   └── trip-service.ts          # tripToIntent, ensureShareToken
├── db/prisma.ts                 # Lazy-init PrismaClient (Proxy pattern)
├── supabase/
│   ├── client.ts                # Browser Supabase client
│   └── server.ts                # SSR Supabase client + getAuthenticatedUserId
├── flights/
│   ├── amadeus.ts               # Amadeus API (OAuth2, Redis cache)
│   ├── optimizer.ts             # Day-assignment flight cost optimizer
│   ├── city-iata-map.ts         # City → IATA fallback (~200 cities)
│   └── types.ts                 # CityWithDays, FlightOption, FlightSkeleton
├── affiliate/link-generator.ts  # Skyscanner, Booking.com, GetYourGuide deep links
├── email/
│   └── index.ts                 # Resend client + sendWelcomeEmail, sendItineraryReadyEmail
├── export/pdf-generator.tsx     # @react-pdf/renderer branded PDF
├── logger.ts                    # Structured logger (dev: human-readable, prod: JSON lines)
└── utils/
    ├── date.ts                  # daysBetween, addDays, formatDateShort
    ├── error.ts                 # getErrorMessage
    ├── trip-metadata.ts         # parseItineraryData, getTripTitle, isSingleCity, etc.
    ├── derive-city-budget.ts    # Pro-rata city budget allocation
    ├── country-flags.ts         # Country code → emoji flag
    ├── generate-packing-list.ts # Packing checklist from itinerary
    └── status-helpers.ts        # Generation status helpers
```

---

## Priority Order

| Priority | Improvement | Impact | Effort | Status |
|----------|------------|--------|--------|--------|
| ~~1~~ | ~~Service layer extraction~~ | ~~High~~ | ~~Medium~~ | **Done** |
| ~~2~~ | ~~Consolidate generation routes + deferred enrichment~~ | ~~High~~ | ~~Medium~~ | **Done** |
| ~~3~~ | ~~Clean up dead code~~ | ~~Low~~ | ~~Low~~ | **Done** |
| ~~4~~ | ~~Itinerary data cast helper~~ | ~~Low~~ | ~~Low~~ | **Done** |
| 5 | Real SSE progress events | Low — only matters for future features | High | Open |
| ~~—~~ | ~~Unify rate limiting~~ | ~~Medium~~ | ~~Low~~ | **Done** |
| ~~—~~ | ~~Structured logging~~ | ~~Medium~~ | ~~Low~~ | **Done** |
| ~~—~~ | ~~Add unit tests for core logic~~ | ~~High~~ | ~~Medium~~ | **Done** |

---

## Summary

The architecture is fundamentally sound — these were refinements, not rewrites. The lazy-init pattern, the auth guard composition, the pipeline's stage-based design, and the deferred enrichment split are all patterns worth keeping.

**7 of 8 actionable items completed.** Rate limiting is unified in middleware, structured logging is in place across all server modules, 13 test files cover the core backend, generation routes are consolidated with deferred enrichment, dead code has been removed, and business logic is isolated in the service layer. The only remaining open item is replacing simulated SSE progress events with real pipeline stage tracking — low priority given the ~5s generation time.

**Key architectural decisions:**
- Generation returns in ~5s by deferring visa + weather enrichment to background client fetches
- All itinerary versioning uses atomic Prisma `$transaction` (deactivate old → create new)
- Guest users can generate and view trips without auth; dashboard + profile are protected
- Schema versioning via Prisma Migrate (not `db push`) with migration files committed to git
- 5 database models (down from 8 after removing unused experiment/analytics tables)
