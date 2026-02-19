# Possible Improvements

## 1. Stream Claude API response to avoid SDK timeout

**Status**: Proposed
**Priority**: Medium
**Affected file**: `src/lib/ai/pipeline.ts` — `callClaude()`

### Problem

The Anthropic SDK `timeout` (currently 50s) applies to the entire non-streaming request. If Claude takes longer than 50s to generate a full response (e.g. a 10,000-token itinerary), the SDK throws before any data is returned.

### Proposal

Switch `messages.create()` to the streaming API (`messages.stream()`). With streaming, the SDK timeout resets on each received chunk, so the total generation can exceed 50s as long as tokens keep flowing.

### Tradeoffs

**Pros:**
- Eliminates SDK-level timeout as a failure mode
- Enables future real-time progress (e.g. "generating day 12 of 22") forwarded through the existing SSE route

**Cons:**
- Full JSON still required before parsing — no latency improvement for the user
- More code complexity (chunk accumulation, stream event handling, adapted content-filter retry)
- Harder to mock/test in unit tests
- Vercel's `maxDuration` (60s) is absolute wall-clock time and unaffected by streaming

### Alternative

Bump the SDK timeout to 55s (`timeout: 55_000`) for a zero-code-change mitigation. This is the current simpler path since Haiku at 10,000 tokens typically completes in 30-40s.

### When to revisit

- If generation times approach 50s regularly (monitor via `[pipeline] Stage 2 complete` logs)
- If we want to show real-time token-level progress to users during generation
- If we switch to a slower model (e.g. Sonnet) for full itinerary generation

---

## 2. Improving Loading User Experience

**Status**: Proposed (5 strategies, ordered by priority)
**Context**: After splitting enrichment (visa/weather) into background loading, the remaining bottleneck is the Claude generation call itself (8-15s for multi-city). These strategies aim to reduce the time before the user sees meaningful content.

### Completed: Background enrichment deferral

Visa and weather data are now loaded in the background after the core itinerary (route, days, activities, budget) is displayed. The user sees the itinerary immediately; visa/weather sections show skeleton loaders that fill in 1-3s later. This removed ~2-4s from the perceived loading time.

- Pipeline split: `generateCoreItinerary()` (fast) vs `generateItinerary()` (full)
- New endpoints: `POST /api/v1/enrich/visa`, `POST /api/v1/enrich/weather`
- Background fetch + Zustand merge on the trip page

### Completed: Strategy A — Speculative pre-generation (start route selection early)

**Status**: Done
**Expected saving**: 3-5s for multi-city trips

Currently, route selection (Haiku picks cities) only starts when the user clicks "Generate" on the final step. But by step 3 of the questionnaire (dates/budget), we already have enough data to call route selection.

**How it works:**
1. When the user reaches step 3, fire off route selection in the background
2. Cache the result in component state or Zustand
3. When the user clicks "Generate", skip route selection and go straight to itinerary generation with the pre-selected cities
4. If the user changes region/dates before clicking Generate, invalidate and re-fetch

**Why it's safe:** Route selection is cheap (Haiku, ~3s, small token count). If the speculative call is wasted (user goes back and changes region), the cost is negligible.

### Completed: Strategy B — Redirect to trip page after route selection, generate days in background

**Status**: Done
**Effort**: Medium
**Expected saving**: User sees content in 3-5s instead of 15s

**Current UI context:** The trip page (`/trip/[id]`) is a single-column layout with 4 tabs: Itinerary (default), Essentials, Budget, Map. There is no persistent map sidebar — the map is its own tab. The Itinerary tab shows expandable day cards, and the top bar shows the trip title, day count, and estimated budget.

**The idea:** Route selection already returns `CityStop[]` (city names, coordinates, countries, day allocations). That's enough data to render several parts of the trip page. Instead of waiting for the full generation to finish, redirect the user to the trip page immediately after route selection and generate the day-by-day plan in the background.

**What each tab can show with just route data (no days/budget yet):**

| Tab | With route only | What's missing |
|-----|----------------|----------------|
| **Map** | Fully functional — all city markers, route lines, popups with city name + days | Nothing |
| **Itinerary** | Skeleton day cards grouped by city (e.g. "Tokyo — Day 1-5", "Hanoi — Day 6-9") with a "Generating activities..." state | Activity details, tips, costs |
| **Budget** | Skeleton — "Calculating budget..." | All budget data |
| **Essentials** | Can start loading visa + weather immediately (already have route) | Packing list (needs weather) |
| **Top bar** | Trip title (countries), day count | Budget estimate |

**Implementation sketch:**
1. After route selection completes, build a partial `Itinerary` with `route` populated, a placeholder `budget` (all zeros), and empty `days[]`
2. Store it in Zustand and navigate to `/trip/[id]`
3. Default the active tab to **Map** (instead of Itinerary), since it's fully rendered
4. Trip page detects empty `days[]` and fires a background API call to generate the full itinerary
5. While generating: Itinerary tab shows skeleton day cards with city names; Budget tab shows skeleton; Essentials tab starts enrichment (visa/weather) in parallel
6. When generation completes (~8-15s), merge `days` and `budget` into the store — tabs reactively populate
7. Animate day cards appearing (staggered fade-in, matching current style)

**UX flow from the user's perspective:**
1. Click "Generate" → brief loading indicator (~3s for route selection, or instant if Strategy A pre-fetched it)
2. Land on trip page, Map tab active — see their cities on a real map with route lines
3. Click around the map, explore city markers
4. Switch to Itinerary tab — see skeleton cards with city names, "Generating your daily plan..."
5. ~8-15s after landing: day cards animate in, budget populates, top bar updates with total

### Strategy C: Stream Claude tokens + progressive day rendering

**Priority**: 3
**Effort**: High
**Risk**: Medium
**Expected saving**: User sees first day in ~2-3s, full itinerary streams in over 10-15s

Use Claude's streaming API (`messages.stream()`) and parse completed JSON day objects as they close in the stream. Push each completed day through SSE to the client.

**How it works:**
1. Switch `messages.create()` to `messages.stream()` in the pipeline
2. Accumulate streamed text chunks
3. After each chunk, attempt to extract complete day objects from the accumulated JSON
4. When a new complete day is detected, emit it via SSE to the client
5. Client renders days one-by-one with staggered animations

**Challenges:**
- Partial JSON parsing is tricky — need a robust bracket-matching or streaming JSON parser
- Content filter retries are harder with streaming
- Error handling mid-stream requires careful UX (what if generation fails after day 5 of 22?)
- Testing is significantly more complex

**This also addresses the SDK timeout issue from Section 1** — streaming resets the timeout on each chunk.

### Strategy D: Parallel per-city generation

**Priority**: 4
**Effort**: High
**Risk**: Medium-High
**Expected saving**: Claude step drops from 8-10s to 3-4s

Instead of one Claude call for the entire itinerary, fire N parallel calls (one per city). Each call generates 3-5 days for a single city with a focused prompt.

**How it works:**
1. Route selection returns cities + day allocation (existing)
2. For each city, fire a parallel Claude call with a single-city prompt
3. Collect results, stitch into one itinerary
4. Validate the combined result

**Risks:**
- Budget allocation across cities needs pre-calculation (can't let Claude decide holistically)
- Travel days between cities may have inconsistencies
- N parallel API calls could hit Anthropic rate limits
- Total token cost may increase (repeated context in each prompt)

### Strategy E: Two-model draft + refine

**Priority**: 5
**Effort**: Medium
**Risk**: Medium
**Expected saving**: User sees draft in ~2s, refined version replaces it in ~10s

Use Haiku with a minimal prompt to generate a rough draft (just city names, 1 activity per day, approximate budget), show it immediately, then run a full-quality generation in the background that replaces the draft.

**How it works:**
1. Fire a "sketch" prompt to Haiku with aggressive `max_tokens` limit (~1,000)
2. Show the sketch immediately (basic itinerary with placeholders)
3. In background, run the full generation with the complete prompt
4. When the full result arrives, animate a transition from sketch to full itinerary

**Risks:**
- User might interact with the draft (e.g., click into a day) before the full version replaces it — need careful state management
- The "flash" of content changing could feel jarring
- Two Claude calls per generation doubles the API cost

---

### Recommended implementation order

| Order | Strategy | Saving | Effort | Cumulative effect |
|-------|----------|--------|--------|-------------------|
| Done | Background enrichment | 2-4s perceived | Low | User sees itinerary immediately |
| Done | A: Speculative pre-gen | 3-5s | Low | Route selection invisible to user |
| Done | B: Route + map first | 5-10s perceived | Medium | User sees map in ~1s |
| 3 | C: Stream + progressive | 5-10s perceived | High | Days appear one-by-one |
| 4 | D: Parallel per-city | 4-6s actual | High | Claude step halved |
| 5 | E: Draft + refine | 8-12s perceived | Medium | Instant (low-quality) content |

Strategies A + B are now implemented. Perceived loading dropped from ~15s to ~1-2s (user sees trip page with map immediately). Strategy C is the gold standard for day-by-day progressive rendering but requires significant engineering investment.
