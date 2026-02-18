# Travel Pro — Production Release Checklist

> Generated from full codebase audit — 2026-02-18.
> Work through this top-to-bottom before going live. Items marked 🚫 are hard blockers.

---

## 🟠 Incomplete Features (Shipped UI With No Backend)

- [ ] **"Add a city" button in Edit page** — renders with no `onClick` handler. Non-functional. See `add-city-feature.md` for analysis and proposed solution (Open-Meteo geocoding).
  - File: `src/app/trip/[id]/edit/page.tsx` line 313

- [ ] **Trigger welcome email after signup** — `sendWelcomeEmail()` is implemented and ready but is never called anywhere. Hook into the Supabase auth callback or signup handler.
  - Caller needed at: `src/app/auth/callback/route.ts` or signup flow
  - Function at: `src/lib/email/index.ts`

- [ ] **Trigger itinerary-ready email after generation** — `sendItineraryReadyEmail()` is implemented but never called. Should fire at end of SSE stream when `stage === "done"`.
  - Caller needed at: `src/app/api/v1/trips/[id]/generate/route.ts` line 117
  - Function at: `src/lib/email/index.ts`

- [ ] **Prompt v2 is built but never used** — `SYSTEM_PROMPT_V2` and `assemblePromptV2()` exist and are higher quality than v1 (chain-of-thought, budget tracking, fewer hallucinations). The `promptVersion` param accepted by the generate endpoint is silently ignored. Either switch the pipeline to v2 or delete the file.
  - File: `src/lib/ai/prompts/v2.ts`

---

## 🟡 Files to Delete

| File | Why |
|------|-----|
| `src/data/generationSteps.ts` | Defined but never imported — `plan/page.tsx` has its own inline copy |
| `src/lib/ai/prompts/v2.ts` | Never imported (unless switching pipeline to v2 — see above) |
| `src/lib/ai/model-selector.ts` | Fully implemented, never imported anywhere |
| `src/lib/ai/validator.ts` | Fully implemented, never imported anywhere |
| `airports.csv` | One-time source data used to generate `airports-full.ts` — add to `.gitignore` and delete from repo |

---

## 🟡 Infrastructure / Reliability

- [ ] **Add `promptVersion` to the pipeline** — the generate endpoint accepts `promptVersion: "v1" | "v2"` but `generateItinerary()` ignores it and always uses v1. Either wire it up or remove the parameter to avoid confusion.
  - File: `src/app/api/v1/trips/[id]/generate/route.ts` line 22 / `src/lib/ai/pipeline.ts`

---

## 🟡 Unused Dependencies (Clean Up `package.json`)

These are installed but not imported anywhere in the source. Remove with `npm uninstall`:

- [ ] `pino` — installed, zero imports found
- [ ] `posthog-node` — installed, zero imports found
- [ ] `@radix-ui/react-collapsible` — installed, zero imports found
- [ ] `@radix-ui/react-select` — installed, zero imports found
- [ ] `@radix-ui/react-slider` — installed, zero imports found
- [ ] `@radix-ui/react-tabs` — installed, zero imports found

---

## 🟡 Code Quality / Duplication

- [ ] **`inputClass` Tailwind string duplicated across 4+ files** — same class string defined independently in `onboarding/page.tsx`, `profile/page.tsx`, `login/page.tsx`, `signup/page.tsx`. Extract to a shared constant.

- [ ] **`generationSteps` defined twice** — `src/data/generationSteps.ts` exports it but `plan/page.tsx` defines its own inline version with slightly different labels. The page should import from the data file.

---

## ✅ Fixed (2026-02-18)

- Hardcoded demo defaults removed from Zustand store (`displayName: ""`, `nationality: ""` instead of "Thomas"/"German")
- Duplicate itinerary storage removed from pipeline — legacy Supabase `storeItinerary()` deleted, only Prisma write remains
- Dead `budgetWithUpdated` variable deleted from edit page
- `amadeus.ts` Redis crash fixed — safe lazy `getRedis()` pattern consistent with rest of codebase
- `activityLevel` and `selectedLanguages` removed from onboarding — fields were collected but never persisted
- `slideVariants` duplication verified clean — both `onboarding/page.tsx` and `plan/page.tsx` already import from `@/lib/animations`
- Auth enforcement on all `/api/v1/trips/*` routes (hybrid: open for create/view/generate, auth+ownership for edit/delete/share/optimize)
- `/api/health` stripped of all sensitive details (no more key/URL/hostname leaks)
- Legacy `/api/trips/` Phase 0 routes deleted
- Affiliate redirect restricted to partner domains only (skyscanner, booking, getyourguide)
- `unsafe-eval` removed from production CSP (dev-only now)
- Profile "Save changes" wired to `PATCH /api/v1/profile`
- Profile "Delete account" wired to `DELETE /api/v1/profile`
- Dashboard navigation fixed (always uses `trip.id`, not `itinerary.id`)
- Profile "Export data" wired to new `GET /api/v1/profile/export` (full DB snapshot)
- Version History placeholder removed from edit page (backend versioning retained for audit)

---

## ✅ Confirmed Good (No Action Needed)

- Zod validation on all user-facing API inputs
- Rate limiting via Upstash Redis sliding window in middleware
- Supabase auth correctly implemented on `/api/v1/profile`
- MapLibre dynamic import (SSR-safe)
- Prisma lazy init pattern for serverless
- Redis lazy init pattern in enrichment
- Visa data: Passport Index static dataset (199 passports × 227 destinations) with disclaimer
- Weather: Open-Meteo historical data with Redis cache
- Share page: only public fields returned, no user data leaked
- PDF export
- Cookie consent / GDPR privacy page
- Itinerary versioning (1-to-many, never upsert on tripId)
- CSP headers
- Affiliate click tracking with IP hash (privacy-preserving)
- SSE generation stream with proper error/failure state in DB
- In-memory rate limiter in shared route — redundant but harmless; middleware Upstash rate limiting is the real protection

---

*Last audited: 2026-02-18 | Next scheduled review: before each major release*
