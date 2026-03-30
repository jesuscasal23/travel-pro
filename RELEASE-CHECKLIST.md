# Fichi — Production Release Checklist

> Generated from full codebase audit — 2026-02-18.
> Last verified against codebase: 2026-03-21
> Work through this top-to-bottom before going live. Items marked 🚫 are hard blockers.

---

## 🟠 Incomplete Features (Shipped UI With No Backend)

- [ ] **"Add a city" button in Edit page** — renders with no `onClick` handler. Non-functional. See `add-city-feature.md` for analysis and proposed solution (Open-Meteo geocoding).
  - File: `src/app/trip/[id]/edit/page.tsx` line 313

- [ ] **Implement welcome email trigger after signup** — Email templates planned but not yet built. Hook into the Supabase auth callback or signup handler once email module is created.
  - Caller needed at: `src/app/auth/callback/route.ts` or signup flow

- [ ] **Implement itinerary-ready email after generation** — Should fire after trip creation (inline skeleton build) once email module is created.
  - Caller needed at: `src/app/api/v1/trips/route.ts` (POST handler, after itinerary persist)

---

## ✅ Files Deleted (cleaned up)

| File                           | Why                                                          |
| ------------------------------ | ------------------------------------------------------------ |
| `src/data/generationSteps.ts`  | Was never imported — `plan/page.tsx` has its own inline copy |
| `src/lib/ai/prompts/v2.ts`     | Was never imported into the pipeline                         |
| `src/lib/ai/model-selector.ts` | Was fully implemented but never imported anywhere            |
| `src/lib/ai/validator.ts`      | Validation consolidated into `src/lib/ai/parser.ts`          |

### Still to do

| File           | Why                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `airports.csv` | One-time source data used to generate `airports-full.ts` — add to `.gitignore` and delete from repo |

---

## 🟡 Infrastructure / Reliability

- [ ] **Clean up `promptVersion` parameter** — the generate endpoint was removed (skeleton is built inline during trip creation). Verify `promptVersion` on the Itinerary model is still used; if not, remove it.
  - File: `prisma/schema.prisma` (Itinerary model)

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

- [ ] ~~**`generationSteps` defined twice**~~ — resolved: `src/data/generationSteps.ts` was deleted, `plan/page.tsx` inline version is canonical.

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

## Quarterly Documentation Audit

Run every quarter (next: 2026-06-21) to prevent doc drift:

1. Run `npm run docs:check-refs` — fix any broken file references
2. Review each doc's "Last verified" date — update or archive stale docs
3. Verify CLAUDE.md matches the current project structure
4. Archive completed or abandoned plans from `docs/plans/`
5. Check `docs/` for docs that duplicate CLAUDE.md — consolidate or delete

---

_Last audited: 2026-03-21 | Next scheduled review: 2026-06-21_
