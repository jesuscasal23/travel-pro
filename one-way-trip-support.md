# One-Way Trip Support — Scope & Implementation Plan

## Background

Currently, all trips planned in Travel Pro implicitly assume a **round-trip**: the user departs from their home airport, visits one or more destinations, and returns home on the final day. There is no UI control, data model field, or prompt instruction that makes this configurable.

This document audits the full impact of introducing one-way trip support and proposes a phased implementation plan.

---

## Affected Areas

### Critical — must change for the feature to work

#### 1. AI Prompt v1 (`src/lib/ai/prompts/v1.ts`)

The prompt assembly function (`assemblePrompt`) explicitly builds a **flight skeleton** that always includes an outbound leg (home → first city) and a return leg (last city → home). The return leg is hardcoded:

```ts
queueFetch(cities[N - 1].iataCode, homeIata, returnDate);
```

For one-way trips, the return fetch and the return entry in the flight skeleton must be omitted. The system prompt copy may also reference a return journey implicitly and will need a conditional section.

#### 2. Flight Optimizer (`src/lib/flights/optimizer.ts`)

The optimizer treats both outbound and return legs as fixed anchors. The model comment literally states:

```
Day 0           = outbound (home → city[0])   FIXED
Day totalDays-1 = return  (city[N-1] → home)  FIXED
```

The sightseeing day allocation formula (`rawTarget = totalDays - 1 - N`) assumes both ends are consumed. For one-way trips:

- The return leg fetch must be skipped.
- The return leg must not be appended to the `legs` array.
- The day allocation formula must be adjusted (one fewer fixed travel day).

---

### High — required for correct data flow end-to-end

#### 3. Types (`src/types/index.ts`)

`TripIntent` (lines 151–165) has no `tripDirection` field. Every function that passes intent through the pipeline (plan page → API → AI pipeline → optimizer) needs this field available.

**Change:** Add `tripDirection: "one-way" | "round-trip"` to `TripIntent`.

#### 4. Zustand Store (`src/stores/useTripStore.ts`)

The persisted plan state (lines 16–95) has no `tripDirection` field. It must be added so the wizard can capture and persist the user's choice.

**Change:** Add `tripDirection: "one-way" | "round-trip"` to store state and initial state, with a corresponding setter action.

#### 5. Planning Wizard (`src/app/plan/page.tsx`)

There is no UI control for trip direction anywhere in the wizard. This is the entry point — users must be able to express their intent.

**Change:** Add a one-way / round-trip toggle to the destination step (consistent with how flight booking sites present this choice). The selection should be stored in the Zustand store and included when creating the trip or triggering generation.

#### 6. Route Selector Prompt (`src/lib/ai/prompts/route-selector.ts`)

The sightseeing day calculation (line 20–24) uses a comment-confirmed assumption: "N cities → N+1 flights" (outbound + N−1 inter-city + 1 return). For one-way trips this should be N flights (outbound + N−1 inter-city, no return).

**Change:** Pass `tripDirection` into the route selector and adjust the flight count and day budget accordingly.

#### 7. Database Schema (`prisma/schema.prisma`)

The `Trip` model (lines 40–63) has no direction field. Without persisting this, a trip loaded from the database loses its direction, breaking regeneration, editing, and sharing.

**Change:** Add `tripDirection String @default("round-trip") @map("trip_direction")` to the `Trip` model. Create and commit a migration immediately after.

#### 8. POST /api/v1/trips Schema (`src/app/api/v1/trips/route.ts`)

`CreateTripSchema` (lines 19–30) does not accept a `tripDirection` field. Any value set in the wizard would be silently dropped.

**Change:** Add `tripDirection: z.enum(["one-way", "round-trip"]).default("round-trip")` to the schema and persist it when creating the Trip record.

---

### Low / No change required

| Component             | File                                  | Status                                                                                           |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Map (`RouteMap`)      | `src/components/map/RouteMap.tsx`     | Draws a LineString through the city sequence — already does **not** loop back. No change needed. |
| Trip timeline display | `src/app/trip/[id]/page.tsx`          | Data-driven; renders whatever `days` are in the itinerary. No change needed.                     |
| Affiliate links       | `src/lib/affiliate/link-generator.ts` | Builds URLs per individual `FlightLeg` — already leg-agnostic. No change needed.                 |
| Share page            | `src/app/share/[token]/page.tsx`      | Generic description copy, no round-trip assumption. Minor copy update optional.                  |
| Summary page          | `src/app/trip/[id]/summary/page.tsx`  | Renders `flightLegs` from itinerary data. No structural change needed.                           |
| Single-city prompt    | `src/lib/ai/prompts/single-city.ts`   | Explicitly states no inter-city travel; `isTravel` is always false. Already compatible.          |

---

## Consequences & Risk Areas

### Backward compatibility

All existing trips in the database have no `tripDirection` value. The Prisma migration must default existing rows to `"round-trip"` so they continue to behave as before. This is safe with `@default("round-trip")`.

### AI prompt quality

The prompt currently gives Claude a flight skeleton to anchor dates to. For one-way trips, removing the return skeleton entry changes the structure Claude receives. The prompt and example JSON will need to be reviewed to ensure Claude doesn't hallucinate a return travel day at the end of the itinerary.

### Budget estimation

The budget breakdown shown to users includes a flights estimate. For round-trips this is (outbound + return) cost. For one-way it should only be the outbound cost, which will typically be roughly half. This affects both the AI prompt's cost hints and the UI budget breakdown component (`src/lib/utils/derive-city-budget.ts` and `BudgetBreakdown`).

### Flight optimizer interaction

The Amadeus flight optimizer is already an optional, best-effort feature. For one-way trips it simply needs to skip fetching the return leg price — the rest of the optimizer logic (inter-city legs, sightseeing day allocation) works the same way.

### UX considerations

- The one-way / round-trip toggle should appear early in the wizard (alongside or just below the destination input) so it can inform downstream UI (e.g., whether to show a "return date" or just a "departure date").
- A one-way trip still has a `dateEnd` (the day the user arrives at their final destination). The field semantics do not change — it remains the last day of the trip.
- Consider whether the end airport (for one-way trips) should be captured. Currently only `homeAirport` is stored. For one-way, the user's final city's IATA code becomes the implicit end point — this is already available via the last `CityStop.iataCode` in the route.

---

## Implementation Plan

### Phase 1 — UI & State (self-contained, no backend needed)

1. Add `tripDirection: "one-way" | "round-trip"` to `TripIntent` in `src/types/index.ts`.
2. Add `tripDirection` field and setter to the Zustand store (`src/stores/useTripStore.ts`).
3. Add a one-way / round-trip toggle UI to the planning wizard (`src/app/plan/page.tsx`), wired to the store.

### Phase 2 — Database & API

4. Add `tripDirection` to `prisma/schema.prisma` (`Trip` model) with `@default("round-trip")`.
5. Run `npx prisma migrate dev --name add_trip_direction` and commit the migration.
6. Update `CreateTripSchema` in `src/app/api/v1/trips/route.ts` to accept and persist `tripDirection`.
7. Propagate `tripDirection` from the Trip record through to `TripIntent` wherever it is reconstructed from the DB (e.g., the generate API route).

### Phase 3 — AI Pipeline & Flights

8. Update `assemblePrompt()` in `src/lib/ai/prompts/v1.ts` to conditionally omit the return flight skeleton entry and the return leg cost hint when `tripDirection === "one-way"`.
9. Update the route selector prompt (`src/lib/ai/prompts/route-selector.ts`) to use N flights instead of N+1 for one-way trips when calculating sightseeing day budget.
10. Update `optimizeFlights()` in `src/lib/flights/optimizer.ts` to accept `tripDirection` and skip the return leg fetch and leg construction when `"one-way"`.

### Phase 4 — Budget Display

11. Update `derive-city-budget.ts` (or wherever flight costs are estimated for display) to halve the flights estimate for one-way trips, or make it clear in the UI that the figure is one-way only.
12. Review `BudgetBreakdown` component for any "return flight" copy.

### Phase 5 — Testing & Polish

13. Add unit tests for one-way prompt assembly (no return leg in skeleton).
14. Add unit tests for one-way flight optimizer (no return leg in output).
15. Add an e2e test that plans a one-way trip end-to-end.
16. Optionally surface `tripDirection` in the summary and share pages as a small copy addition ("One-way · 14 days").

---

## Effort Estimate (rough)

| Phase                    | Complexity | Notes                                                       |
| ------------------------ | ---------- | ----------------------------------------------------------- |
| Phase 1 — UI & State     | Low        | ~3 files, mostly additive                                   |
| Phase 2 — DB & API       | Low-Medium | Migration + schema changes; backward-safe                   |
| Phase 3 — AI & Flights   | Medium     | Prompt changes carry regression risk; needs careful testing |
| Phase 4 — Budget Display | Low        | Minor UI copy/logic update                                  |
| Phase 5 — Tests          | Medium     | Prompt/optimizer unit tests + e2e                           |

**Overall:** Medium effort. No architectural changes required. The most risk-prone area is the AI prompt and optimizer changes — these should be tested with real generation runs before release.
