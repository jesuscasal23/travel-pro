# Backend Agent Guide

This guide is the canonical starting point for backend changes in Travel Pro.

Read this together with [backend-conventions.md](./backend-conventions.md). The conventions doc is the primary style reference.

## Stack

- Runtime: Next.js App Router route handlers (`src/app/api/**/route.ts`)
- DB: Prisma + PostgreSQL (`src/lib/db/prisma.ts`)
- Auth: Supabase session cookies (`src/lib/supabase/server.ts`)
- Validation: shared Zod contracts in `src/lib/api/schemas.ts`
- Error handling and request IDs: `apiHandler` in `src/lib/api/helpers.ts`
- Feature modules: `src/lib/features/**`

## Route Conventions

- Wrap API routes with `apiHandler(routeName, handler)`.
- Prefer the route shape `assert access -> parse input -> call feature service -> serialize -> return`.
- Parse JSON with `parseAndValidateRequest(req, schema)`.
- Parse query strings with `parseAndValidateSearchParams(searchParams, schema)`.
- Throw typed errors from `src/lib/api/errors.ts` for handled failures.
- Route responses include `x-request-id` automatically via `apiHandler`.

## Trip Access Rules

Use `assertTripAccess(req, tripId, options)` from `src/lib/api/helpers.ts`.

- `requireTripOwner: true`
  - If trip has `profileId`, auth + ownership is required.
  - If trip has no `profileId` (guest trip), the signed guest-owner cookie is required.
- `allowGuestId: true`
  - Allows synthetic `tripId === "guest"` for stateless guest endpoints.

## Canonical Imports

Import from public `@/lib/*` wrappers, not `@/lib/core/*`.

- Use `@/lib/logger`
- Use `@/lib/db/prisma`
- Use `@/lib/request-context`
- Use `@/lib/supabase/server`
- Use feature modules such as `@/lib/features/trips/*` when a backend concern clearly belongs to one feature

Lint enforces this in `eslint.config.mjs` (`no-restricted-imports`).

## API Inventory

- Health: `GET /api/health`
- Cron: `GET /api/cron/cleanup-stale-generations`
- Affiliate: `GET /api/v1/affiliate/redirect`
- Client errors: `POST /api/v1/client-errors`
- Profile: `GET/PATCH/DELETE /api/v1/profile`, `GET /api/v1/profile/export`
- Trips: `GET/POST /api/v1/trips`
- Trip by id: `GET/PATCH/DELETE /api/v1/trips/:id`
- Trip generation: `POST /api/v1/trips/:id/generate`, `POST /api/v1/trips/:id/generate-activities`
- Flights: `POST /api/v1/trips/:id/flights`, `POST /api/v1/trips/:id/optimize`
- Sharing: `GET /api/v1/trips/:id/share`, `GET /api/v1/trips/shared/:token`
- Enrichment: `POST /api/v1/enrich/visa|weather|accommodation`

## Testing Expectations

For each route, keep at least:

- 1 happy-path test
- 1 auth/validation/error-path test

Route tests live next to route folders under `__tests__/route.test.ts`.

Useful commands:

- `npm run test`
- `npm run test:integration`
- `npm run typecheck`
- `npm run lint`
