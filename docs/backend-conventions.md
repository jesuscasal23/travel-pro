# Backend Conventions

> Last verified against codebase: 2026-04-03

This is the current backend style guide for Fichi.

## Route Shape

Default route order:

1. assert auth or access
2. parse and validate request data
3. call a feature service
4. serialize the response shape
5. return `NextResponse.json(...)` or a specialized response

Keep route handlers thin. Business logic belongs in `src/lib/features/**` or narrow infrastructure helpers.

Use `apiHandler(...)` for standard JSON routes. Exceptions are allowed when Next.js requirements force a custom shape, such as:

- raw-body webhooks like `src/app/api/v1/stripe/webhook/route.ts`
- binary/image proxy routes like `src/app/api/v1/places/photo/route.ts`

## Feature Layout

Prefer feature-oriented modules over technical buckets.

- `src/lib/features/trips/*`
- `src/lib/features/profile/*`
- `src/lib/features/selections/*`
- `src/lib/features/affiliate/*`
- `src/lib/features/enrichment/*`
- `src/lib/features/feedback/*`
- `src/lib/features/stripe/*`
- `src/lib/features/cities/*`
- `src/lib/features/health/*`

Shared cross-cutting code stays in:

- `src/lib/api/*` for handler wrappers, auth guards, pagination, and HTTP-layer errors
- `src/lib/config/*` for validated env access
- `src/lib/core/*` for Prisma, logging, request context, Supabase clients, and low-level infrastructure

## Errors

Throw typed backend errors from `src/lib/api/errors.ts`.

Common cases:

- `ValidationError` for bad payloads
- `UnauthorizedError` for missing auth
- `ForbiddenError` for superuser or access-policy failures
- `TripOwnerRequiredError` for trip ownership failures
- `TripNotFoundError` and `ProfileNotFoundError` for missing records

Do not throw bare strings or depend on matching free-form error messages.

## Env Access

Do not read `process.env.*` directly inside business logic unless the file is itself an env/config boundary.

Prefer:

- `src/lib/config/server-env.ts` for validated server env access
- route-local exceptions only when a platform API requires raw env access and there is no shared accessor yet

## Schemas

Put request/query schemas as close as possible to the feature that owns them.

Current pattern:

- trips: `src/lib/features/trips/schemas.ts`
- selections: `src/lib/features/selections/schemas.ts`
- enrichment: `src/lib/features/enrichment/schemas.ts`
- feedback: `src/lib/features/feedback/schemas.ts`
- stripe: `src/lib/features/stripe/schemas.ts`

Shared backend primitives live in `src/lib/schemas/index.ts`.
Shared form-only validation lives in `src/lib/forms/schemas.ts`.

## Prisma Query Shapes

Centralize reusable Prisma `select` and `include` objects in feature query-shape modules.

Examples:

- `src/lib/features/trips/query-shapes.ts`
- `src/lib/features/profile/query-shapes.ts`

This prevents silent drift between endpoints that should return the same record shape.

## Auth And Access

Use the shared helpers in `src/lib/api/helpers.ts`:

- `requireAuth()` for authenticated-only routes
- `requireProfile()` when a route needs a persisted profile row
- `requireSuperUser()` for admin-only routes
- `assertTripAccess()` for owner checks and guest-owner-cookie access on trip APIs

Keep auth rules explicit in the route file instead of hiding them inside unrelated services.

## Pure vs I/O

Keep pure transforms out of route and service files whenever the logic is non-trivial.

Examples:

- affiliate URL helpers: `src/lib/features/affiliate/link-generator.ts`
- affiliate redirect validation/hash utilities: `src/lib/features/affiliate/redirect-utils.ts`
- cart derivation logic: `src/lib/features/selections/cart-derive.ts`
- enrichment transforms: `src/lib/features/enrichment/transforms.ts`

Pure utilities should not perform logging, network calls, or database writes.
