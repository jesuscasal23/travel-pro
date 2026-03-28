# Backend Conventions

> Last verified against codebase: 2026-03-21

This is the canonical backend style guide for Fichi.

## Route Shape

Every route handler should follow the same order:

1. assert access
2. parse and validate input
3. call a feature service
4. serialize the response
5. return `NextResponse.json(...)` or `NextResponse.redirect(...)`

Routes should stay thin. Business logic belongs in `src/lib/features/**` or narrow backend services.

## Feature Layout

Prefer feature-oriented modules over technical buckets.

- `src/lib/features/trips/*`
- `src/lib/features/profile/*`
- `src/lib/features/generation/*`
- `src/lib/features/enrichment/*`
- `src/lib/features/affiliate/*`
- `src/lib/features/client-errors/*`
- `src/lib/features/health/*`

Shared cross-cutting code stays in:

- `src/lib/api/*` for handler helpers and HTTP-layer errors
- `src/lib/config/*` for validated env access
- `src/lib/core/prisma.ts` for the Prisma client entrypoint

## Errors

Throw typed backend errors from `src/lib/api/errors.ts`.

Use:

- `ValidationError` for bad payloads
- `UnauthorizedError` for auth failures
- `TripOwnerRequiredError` for trip ownership failures
- `TripNotFoundError`, `ProfileNotFoundError`, `ActiveItineraryNotFoundError` for missing resources
- `ServiceMisconfiguredError` for missing server configuration
- `UpstreamServiceError` for dependency failures

Do not throw bare strings or rely on matching error messages.

## Env Access

Do not read `process.env.*` directly inside route handlers or services.

Use `src/lib/config/server-env.ts` accessors instead so missing or malformed env is reported consistently.

## Schemas

Request/query schemas live with the feature they validate.

- profile schemas: `src/lib/features/profile/schemas.ts`
- trip and generation schemas: `src/lib/features/generation/schemas.ts`
- client error report schemas: `src/lib/features/client-errors/schema.ts`

Shared form schemas live in `src/lib/forms/schemas.ts`.

## Prisma Query Shapes

Centralize reusable Prisma `select` and `include` objects in feature query-shape modules.

Examples:

- `src/lib/features/trips/query-shapes.ts`
- `src/lib/features/profile/query-shapes.ts`

This avoids silent drift between endpoints that should return the same shape.

## Pure vs I/O

Keep pure transforms out of route and service files whenever the logic is non-trivial.

Examples:

- route selection shortcuts: `src/lib/features/generation/select-route-transform.ts`
- affiliate redirect validation/hash utilities: `src/lib/features/affiliate/redirect-utils.ts`

Pure utilities should not perform logging, network calls, or DB writes.
