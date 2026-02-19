# Travel Pro — Backend Improvement Assessment

> Based on a full code audit of the backend (2026-02-19).
> Updated: 2026-02-19 — Items #1, #3, #5, #8 implemented.

---

## What's Done Well

The backend is solid for a Phase 1 MVP. A few things stand out positively:

- **Lazy initialization** across all service clients (Prisma, Redis, Resend, Anthropic) is well-executed and prevents build-time crashes
- **The `apiHandler` wrapper + `ApiError` class** gives consistent error responses across all routes
- **Auth guards** (`requireAuth`, `requireProfile`, `requireTripOwnership`) are clean and composable
- **Fail-open resilience** is the right choice at this stage — weather, visa, Redis, DB persist all degrade gracefully
- **The AI pipeline** has clear stages with good timing instrumentation

---

## What Should Be Improved

### 1. ~~Two parallel generation systems with duplicated logic~~ — DONE

Consolidated all generation through the single v1 SSE route (`POST /api/v1/trips/[id]/generate`). Changes:
- **Plan page**: Unified `handleGenerate` — both guest and auth users now create a trip via `POST /api/v1/trips` (anonymous: `profileId: null`), set a partial itinerary in the store, and redirect to `/trip/{id}` where background generation fires via SSE
- **Trip page**: Removed entire guest `/api/generate` branch — all generation goes through the v1 SSE endpoint. Cities passed conditionally (from store route or let pipeline do route selection)
- **Deleted** `/api/generate/route.ts` (Phase 0 generation endpoint) and its integration test
- **Kept** `/api/generate/select-route` (still needed for speculative pre-fetch on the plan page)
- **Middleware**: Updated rate limit to only cover `/api/generate/select-route` (removed `/api/generate` entry)

### 2. No service layer — business logic lives in route handlers

This is the biggest structural issue. Route handlers like `trips/[id]/generate/route.ts` and `trips/[id]/route.ts` (PATCH) contain substantial business logic inline: itinerary versioning, deactivation of old versions, status transitions, SSE stream construction.

This makes it:
- Hard to unit test (you'd need to mock HTTP requests)
- Easy to introduce inconsistencies (versioning logic in PATCH vs generate)
- Difficult for a new developer to find "where does itinerary versioning happen?"

**Recommendation:** Extract a `TripService` and `ItineraryService` to centralize business logic:
```ts
ItineraryService.createVersion(tripId, data)  // handles deactivation + version increment
ItineraryService.updateStatus(id, status)
TripService.generateShareToken(tripId)
```

### 3. ~~Three different rate limiting approaches~~ — DONE

All rate limiting now runs through the middleware (Upstash Redis sliding window). Removed the lazy-initialized in-route limiter from `/api/generate` and `/api/generate/select-route`, and removed the in-memory Map limiter from `/api/v1/trips/shared/[token]`. Middleware now covers four tiers:
- `/api/v1/trips/*/generate`: 5 req/hour
- `/api/generate/select-route`: 10 req/min
- `/api/v1/trips/shared/*`: 60 req/min
- `/api/v1/*` general: 30 req/min

### 4. Dead code adds cognitive load

There's a meaningful amount of infrastructure that's defined but never wired up:
- `prompts/v2.ts` — full prompt system, never called
- `model-selector.ts` — routing logic, never imported by the pipeline
- `validator.ts` → `buildRetryPrompt()` — generates retry prompts, never invoked
- `sendWelcomeEmail()`, `sendItineraryReadyEmail()` — ready but called from nowhere
- `Experiment`, `ExperimentAssignment`, `AnalyticsEvent` DB models — no routes or logic consume them

For a new developer reading the codebase, it's hard to distinguish "this is active" from "this is planned."

**Recommendation:** Either wire it up or move it to a `_future/` directory (or delete and re-create when needed — it's in git history).

### 5. ~~No structured logging~~ — DONE

Added `src/lib/logger.ts` — a lightweight `createLogger(module)` factory used across all server-side modules. Features:
- **Log levels**: debug, info, warn, error (configurable via `LOG_LEVEL` env var)
- **Dev format**: `HH:mm:ss.SSS LEVEL [module] message | key=value`
- **Production format**: JSON lines with timestamp, level, module, message, and context fields
- Replaced all `console.log/warn/error` calls in: pipeline, enrichment, API helpers, route handlers, Amadeus, email, affiliate redirect

### 6. The `Json` → `Itinerary` double-cast is a paper cut

Every time itinerary data is read from the DB, the code writes `data as unknown as Itinerary`. This is scattered across multiple route handlers.

**Recommendation:** A small helper would reduce noise:
```ts
function parseItineraryData(itinerary: { data: JsonValue }): Itinerary {
  return itinerary.data as unknown as Itinerary;
}
```
Or a Prisma extension that does this automatically.

### 7. SSE progress stages are simulated

The SSE stream sends events for "route", "activities", "visa", "weather", "budget" with artificial delays — but the actual pipeline runs as one `generateItinerary()` call. The progress events don't reflect real pipeline stages.

**Recommendation:** If real progress tracking is ever needed (e.g., for longer generations or background jobs), refactor the pipeline to emit real events via a callback or event emitter pattern.

### 8. ~~No backend unit tests~~ — DONE

Added 10 unit test files (267 tests total passing) covering core backend logic:
- `src/lib/ai/__tests__/pipeline.test.ts` — `extractJSON`, `parseAndValidate` (14 tests)
- `src/lib/ai/__tests__/validator.test.ts` — `validateItinerary`, `buildRetryPrompt` (12 tests)
- `src/lib/ai/__tests__/enrichment.test.ts` — `enrichVisa`, `enrichWeather` (9 tests)
- `src/lib/ai/__tests__/model-selector.test.ts` — `selectModel`, `getMaxTokens`, `getTemperature` (13 tests)
- `src/lib/utils/__tests__/derive-city-budget.test.ts` — `parseCostString`, `deriveCityBudgets` (14 tests)
- `src/lib/utils/__tests__/date.test.ts` — `daysBetween`, `addDays`, `formatDateShort` (13 tests)
- `src/lib/utils/__tests__/error.test.ts` — `getErrorMessage` (7 tests)
- `src/lib/utils/__tests__/trip-metadata.test.ts` — `isSingleCity`, `getTripTitle`, `getUniqueCountries`, `getBudgetStatus` (8 tests)
- `src/lib/api/__tests__/helpers.test.ts` — `ApiError`, `validateBody`, `getClientIp`, `apiHandler`, auth guards (19 tests)
- `src/lib/api/__tests__/schemas.test.ts` — `ProfileInputSchema`, `TripIntentInputSchema`, `CityWithDaysInputSchema` (16 tests)

---

## Priority Order

| Priority | Improvement | Impact | Effort | Status |
|----------|------------|--------|--------|--------|
| 1 | Service layer extraction | High — maintainability, testability | Medium | Open |
| ~~2~~ | ~~Consolidate generation routes~~ | ~~High~~ | ~~Medium~~ | **Done** |
| 3 | Clean up dead code | Low — reduces cognitive load | Low | Open |
| 4 | Itinerary data cast helper | Low — ergonomic improvement | Low | Open |
| 5 | Real SSE progress events | Low — only matters for future features | High | Open |
| ~~—~~ | ~~Unify rate limiting~~ | ~~Medium~~ | ~~Low~~ | **Done** |
| ~~—~~ | ~~Structured logging~~ | ~~Medium~~ | ~~Low~~ | **Done** |
| ~~—~~ | ~~Add unit tests for core logic~~ | ~~High~~ | ~~Medium~~ | **Done** |

---

## Summary

The architecture is fundamentally sound — these are refinements, not rewrites. The lazy-init pattern, the auth guard composition, and the pipeline's stage-based design are all patterns worth keeping.

**4 of 8 items completed** — rate limiting is unified, structured logging is in place, 249 unit tests cover the core backend, and generation routes are consolidated into a single SSE path. The highest-impact remaining change is extracting a service layer so that business logic is testable, centralized, and decoupled from HTTP concerns.
