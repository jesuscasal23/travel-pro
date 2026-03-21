# Add City to Trip — Edit Page Enhancement

## Context

The edit page (`/trip/[id]/edit`) currently supports reordering cities (drag-drop), adjusting day counts (+/-), and removing cities. However, the "Add a city" button is a no-op placeholder. Users need the ability to **add new cities** to their trip and get AI-generated activities for those cities — this is the most requested missing piece of the edit workflow.

**Approach:** When a user adds a city and saves, a lightweight AI call generates activities for just the new city's days (~5-15s), which are merged into the existing itinerary. No full regeneration needed.

---

## Phase 1: CityCombobox — Add `excludeCities` Prop

**File:** `src/components/ui/CityCombobox.tsx`

- Add optional `excludeCities?: string[]` prop (format: `"Tokyo,JP"`)
- Filter results to exclude cities already in the route
- Backward-compatible — existing usages on the plan page are unaffected

---

## Phase 2: Add-City AI Prompt

**New file:** `src/lib/ai/prompts/add-city.ts`

- `SYSTEM_PROMPT_ADD_CITY` — "expert travel planner adding a NEW city to an existing trip"
  - Generate days ONLY for the new city (3-5 activities/day)
  - Avoid duplicating activities from the existing itinerary (passed as context)
  - Include travel day from previous city if applicable
  - Return per-city budget addition (accommodation, food, activities, transport — no flights)
- `assembleAddCityPrompt(params)` — accepts new city, existing route/days, prev/next cities, profile info
- Response shape: `{ days: TripDay[], budgetAddition: { accommodation, food, activities, transport } }`

---

## Phase 3: Pipeline Function + API Endpoint

### Pipeline — `src/lib/ai/pipeline.ts`

- Add `generateCityActivities(params)` function
- Uses `callClaude()` with `SYSTEM_PROMPT_ADD_CITY`, `maxTokens: 3000`
- New `addCityResponseSchema` Zod schema for validation
- Export `AddCityResult` type

### API — `src/app/api/v1/trips/[id]/add-city/route.ts` (NEW)

- `POST` endpoint — plain request/response (not SSE — 5-15s fits within timeout)
- Accepts: `{ newCity, existingRoute, existingDays, prevCity, nextCity, travelStyle, interests, travelers, dateStart, nationality }`
- Calls `generateCityActivities()` + parallel `enrichVisa()` / `enrichWeather()` for the new city
- Returns: `{ days, budgetAddition, visaData, weatherData }`
- No auth required (stateless AI call, works for both guest and auth users)
- `maxDuration: 30`

---

## Phase 4: Itinerary Merge Helper

**New file:** `src/lib/itinerary/merge.ts`

Pure function `mergeItinerary(existing, newRoute, newCityDays, budgetAddition)`:

1. Build merged days array in route order — existing city days kept, new city days inserted at correct position
2. Handle travel days: remove old travel days between cities that now have a new city between them; AI-generated days include arrival travel day
3. Renumber all days sequentially (1, 2, 3...)
4. Recalculate dates using `addDays()` + `formatDateShort()` from `src/lib/utils/date.ts`
5. Recalculate budget: add `budgetAddition` to existing budget, recompute total
6. Return complete updated `Itinerary`

---

## Phase 5: Edit Page UI + Save Flow

**File:** `src/app/trip/[id]/edit/page.tsx`

### New state

```
isAddingCity: boolean           — toggles CityCombobox visibility
newCityIds: Set<string>         — tracks which cities are newly added (for AI gen on save)
isGeneratingActivities: boolean — loading state during AI calls
```

### UI changes

**"Add a city" button** (both single-city and multi-city branches):

- Click → reveals inline CityCombobox with "Search for a city" header + cancel (X) button
- CityCombobox uses `excludeCities` to prevent duplicates
- On selection → converts `CityEntry` to `CityStop` (generate id, default 2 days), appends to `cities`, records in `newCityIds`, hides combobox
- New cities show a "New" badge in the sortable list

**Single-city → multi-city transition:**

- Add an "Add another city" button below the single-city day adjuster
- When a second city is added, `cities.length > 1` triggers the multi-city UI branch automatically (DndContext with sortable cards)

**Prevent removing last city:** `removeCity` checks `cities.length > 1`

### `detectEditType()` update

Add detection for added cities (check first, highest priority — triggers AI generation):

```
const added = newIds.filter(id => !origIds.includes(id));
if (added.length > 0) → editType: "add_city"
```

### `handleSave()` update

When `editType === "add_city"`:

1. Set `isGeneratingActivities = true`
2. For each new city, call `POST /api/v1/trips/{id}/add-city` with city + context
3. Collect generated days + budget additions + visa/weather data
4. Call `mergeItinerary()` to produce the updated itinerary
5. Continue with existing save flow (guest: `setItinerary()`, auth: `PATCH /api/v1/trips/{id}`)

Save button shows "Generating activities..." during AI calls.

### `removeCity()` update

Also remove from `newCityIds` when a newly-added city is removed before saving.

### Budget Impact preview

Show estimated addition for new cities based on existing per-day rate:
`estimatedDailyRate = (total - flights) / existingTotalDays`

### Store access

Read `travelStyle`, `interests`, `travelers`, `dateStart`, `nationality` from `useTripStore` to pass to the add-city API.

---

## Phase 6: Tests + Build Verification

### Unit tests

- `src/lib/ai/__tests__/add-city.test.ts` — test `assembleAddCityPrompt`, response schema validation
- `src/lib/itinerary/__tests__/merge.test.ts` — test day renumbering, budget calculation, travel day handling, edge cases (add to end, add to beginning, add multiple)

### Existing tests

- Run full suite to check for regressions (especially `route.integration.test.ts`)

### Build

- `npm run build` — verify no TypeScript errors

---

## Files Summary

| Action     | File                                          |
| ---------- | --------------------------------------------- |
| Edit       | `src/components/ui/CityCombobox.tsx`          |
| **Create** | `src/lib/ai/prompts/add-city.ts`              |
| Edit       | `src/lib/ai/pipeline.ts`                      |
| **Create** | `src/app/api/v1/trips/[id]/add-city/route.ts` |
| **Create** | `src/lib/itinerary/merge.ts`                  |
| Edit       | `src/app/trip/[id]/edit/page.tsx`             |
| **Create** | `src/lib/ai/__tests__/add-city.test.ts`       |
| **Create** | `src/lib/itinerary/__tests__/merge.test.ts`   |

3 edits, 5 new files.

## Key Reusable Code

- `CityCombobox` — already built for single-city plan flow, just needs `excludeCities` filter
- `callClaude()` / `extractJSON()` / `parseAndValidate()` pattern — reuse from `src/lib/ai/pipeline.ts`
- `enrichVisa()` + `enrichWeather()` — reuse from `src/lib/ai/enrichment.ts`
- `addDays()` + `formatDateShort()` — reuse from `src/lib/utils/date.ts`
- `apiHandler()` + `parseJsonBody()` + `validateBody()` — reuse from `src/lib/api/helpers.ts`
- `EditItinerarySchema` in PATCH route already has `"add_city"` in its enum
