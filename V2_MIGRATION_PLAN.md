# V2 UI Migration Plan

## Overview

Full UI redesign of all views. New design tokens, new components, new pages — built in isolation with mocked data, then wired to existing (and extended) backend.

## Principles

- **No v1 move.** Current views stay in place at their current routes. V2 is built under `/v2/...` routes.
- **Mock-first.** V2 pages use hardcoded mock data matching existing TypeScript types (with documented deviations where new designs require new fields).
- **Incremental hookup.** After visual validation, backend is connected progressively.
- **Clean swap.** Once v2 works end-to-end, delete old pages and remove `/v2` prefix from routes.

---

## Phase 1: V2 Foundation

**Goal:** Set up the v2 route structure, new design tokens, and shared component library.

### 1.1 New design tokens

- Create `src/app/v2/globals-v2.css` with new `@theme inline` tokens (colors, spacing, typography).
- V2 layout imports this alongside or instead of the current globals.

### 1.2 V2 route group

- Create `src/app/v2/` with its own `layout.tsx` (applies v2 tokens, v2 Navbar, v2 Providers if needed).
- All v2 pages live under this folder. Routes become `/v2/dashboard`, `/v2/plan`, `/v2/trip/[id]`, etc.

### 1.3 V2 shared components

- Create `src/components/v2/ui/` for redesigned primitives (Button, Card, Input, Modal, etc.).
- Reuse existing components where the design hasn't changed — import from `src/components/ui/`.
- New v2-specific components go in `src/components/v2/`.

### 1.4 Mock data

- Create `src/data/v2-mock-data.ts` — mock data for all v2 views.
- Types: start with existing types from `src/types/index.ts`. If a view needs new fields, add them to a `src/types/v2.ts` file that extends/modifies existing types.

---

## Phase 2: Build V2 Pages (Mock Data Only)

**Goal:** Build all 10 views from screenshots with mocked data. No backend calls.

Each view is built one at a time. For each view:

1. User provides screenshot + description of the view
2. Agent builds the page + any new components needed
3. User tests at `/v2/...` URL and gives feedback
4. Iterate until design matches

### Views to build (10 pages):

| #   | View                  | V2 Route                                    | Current Route                         | Notes                             |
| --- | --------------------- | ------------------------------------------- | ------------------------------------- | --------------------------------- |
| 1   | Landing / Marketing   | `/v2`                                       | `/`                                   | Hero, features, CTA               |
| 2   | Auth (Login/Signup)   | `/v2/login`, `/v2/signup`                   | `/login`, `/signup`                   | Can share layout                  |
| 3   | Forgot/Reset Password | `/v2/forgot-password`, `/v2/reset-password` | `/forgot-password`, `/reset-password` | Similar to auth                   |
| 4   | Onboarding            | `/v2/onboarding`                            | `/onboarding`                         | Multi-step profile setup          |
| 5   | Dashboard             | `/v2/dashboard`                             | `/dashboard`                          | Trip list                         |
| 6   | Plan Questionnaire    | `/v2/plan`                                  | `/plan`                               | Multi-step trip wizard            |
| 7   | Trip View             | `/v2/trip/[id]`                             | `/trip/[id]`                          | Main itinerary (mobile + desktop) |
| 8   | Trip Summary          | `/v2/trip/[id]/summary`                     | `/trip/[id]/summary`                  | Export, share, affiliate          |
| 9   | Share (Public)        | `/v2/share/[token]`                         | `/share/[token]`                      | Read-only itinerary               |
| 10  | Profile               | `/v2/profile`                               | `/profile`                            | Settings, data, account           |

### Testing during Phase 2

- Visit `/v2/...` URLs directly in the browser.
- All data is mocked — no auth required, no API calls.
- Compare against screenshots for design accuracy.

---

## Phase 3: Backend Integration

**Goal:** Replace mocked data with real backend calls. Extend backend where needed.

### 3.1 Audit

For each v2 view, evaluate:

- What data does it need?
- Which existing API routes already provide it?
- What's missing (new endpoints, new fields, schema changes)?

### 3.2 Hook up existing backend

Connect v2 views to existing API routes and hooks:

- `useItinerary`, `useTrips`, `useAuthStatus`, `useSaveProfile`, etc.
- Zustand store (`useTripStore`) — adjust if v2 needs different state shape.
- React Query hooks for enrichment (visa, weather, accommodation).

### 3.3 Extend backend

For gaps identified in 3.1:

- Add new API routes or modify existing ones.
- Update Prisma schema + create migrations if new DB fields needed.
- Update TypeScript types (merge `v2.ts` additions into `types/index.ts`).

### 3.4 Auth & middleware

- Ensure `middleware.ts` protects `/v2/dashboard` and `/v2/profile` the same way.
- Test auth flows (login → redirect to v2 dashboard).

---

## Phase 4: Validation & Swap

**Goal:** Full end-to-end testing, then clean swap.

### 4.1 Redirect for testing

- Add Next.js rewrites in `next.config.ts` to send all traffic to v2 routes:
  ```js
  rewrites: () => [{ source: '/dashboard', destination: '/v2/dashboard' }, ...]
  ```
- Test full user flows: signup → onboarding → plan → trip → summary → share.

### 4.2 Clean swap

Once validated:

1. Delete old page files (`src/app/(marketing)/`, `src/app/(auth)/`, `src/app/dashboard/`, `src/app/plan/`, `src/app/trip/`, `src/app/share/`, `src/app/onboarding/`, `src/app/(app)/profile/`).
2. Move v2 pages to root routes (remove `/v2` prefix from folder structure).
3. Delete `src/components/` old view components (keep any still reused).
4. Move `src/components/v2/` contents to `src/components/`.
5. Merge v2 CSS tokens into `globals.css`, delete `globals-v2.css`.
6. Remove rewrites from `next.config.ts`.
7. Update middleware paths back to normal.
8. Delete `src/types/v2.ts` (already merged into `types/index.ts`).
9. Delete mock data file.

### 4.3 Final cleanup

- Run full test suite (Vitest + Playwright).
- Verify all links, redirects, share URLs work.
- Check no dead imports or unused files remain.
- Delete this plan file.

---

## Working Agreement

- **One view at a time.** User provides screenshot → agent builds → user reviews → next view.
- **Mock types match real types.** Any type deviations are documented in `src/types/v2.ts` so backend gaps are visible early.
- **No premature backend work.** Phase 2 is purely visual. Backend changes happen in Phase 3.
- **Existing app stays functional.** Current routes are untouched until Phase 4 swap.
