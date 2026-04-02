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

---

## 5. Add deterministic `data-testid` hooks for end-to-end testing

**Status**: Proposed  
**Priority**: Medium  
**Affected areas**: Planner wizard, onboarding CTAs, premium paywall buttons

Playwright + MCP automation currently relies on visible text like “Start Planning” or “Your trip is ready”. Whenever copy changes, the selectors break and the regression suite fails even though the UX still works.

**Proposal**

- Add `data-testid` attributes to the major CTA buttons, step headers, and summary cards that automation scripts interact with most frequently.
- Document the IDs in `docs/testing.md` so QA and developers know what’s available.

**Expected impact**

- MCP/Playwright flows become far less brittle
- Copywriters can adjust hero text without coordinating selector updates
- Enables targeted screenshots or analytics by referencing the same IDs

**Risks**

- Needs coordination with design to ensure attributes don’t bleed into production DOM if they don’t want them; could gate them behind `NEXT_PUBLIC_TEST_IDS=1` if necessary.

---

## 6. Dev-mode analytics + monitoring guardrail

**Status**: Proposed  
**Priority**: Low  
**Affected files**: `sentry.*.config.ts`, `src/lib/analytics/*`

Even with Sentry disabled in development, other analytics providers (PostHog, custom `/monitoring` endpoint) still attempt network calls and often 401. These fill the console with noise and slow down local reloads.

**Proposal**

- Add a single `isAnalyticsEnabled` helper that returns `true` only when `NODE_ENV === "production"` (or when an explicit env flag is set).
- Use the helper wherever we initialize analytics SDKs or call `/monitoring`.

**Expected impact**

- Quiet local consoles, less flaky screenshots and automated tests.
- Dev builds spend less time retrying failing analytics requests.

**Risks**

- Need to ensure we don’t accidentally disable analytics in preview/staging deployments where we still need telemetry.

---

## 7. MCP audit script CLI ergonomics

**Status**: Proposed  
**Priority**: Medium  
**Owner**: Developer Experience

`scripts/playwright_mcp_audit.py` currently runs the full authenticated + anonymous suite every time. When Supabase credentials are missing, half the tests fail immediately and developers have to hack the script by hand.

**Proposal**

- Add `argparse` flags such as `--skip-auth` and `--only planner,premium`.
- Teach the script to auto-detect whether `E2E_TEST_EMAIL` is available and skip auth-only routes if not.
- Emit a concise summary table (pass/fail/duration) at the end.

**Benefits**

- Faster iteration when you just need to verify planner or onboarding tweaks.
- CI can run the full suite, while local contributors opt into a subset.

**Risks**

- Slightly more complex CLI surface; needs documentation in the script header.
