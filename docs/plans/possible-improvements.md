# Possible Improvements

> Background enrichment deferral, Strategy A (speculative pre-generation), and Strategy B (route + map first) are already implemented. Perceived loading dropped from ~15s to ~1-2s.

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

## 2. Stream Claude tokens + progressive day rendering

**Priority**: Next
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

---

## 3. Parallel per-city generation

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

---

## 4. Two-model draft + refine

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
