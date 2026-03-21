# Travel Pro

AI-powered multi-destination trip planner built with Next.js, Prisma, Supabase, and Anthropic.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Core Commands

```bash
npm run dev
npm run build
npm run test
npm run test:integration
npm run lint
npm run typecheck
```

## Backend

- API routes: `src/app/api/**/route.ts`
- Shared API helpers: `src/lib/api/helpers.ts`
- Feature schemas: `src/lib/features/*/schemas.ts`
- Prisma client: `src/lib/core/prisma.ts`

Backend conventions: [docs/backend-conventions.md](docs/backend-conventions.md)

## Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:set-superuser -- --email you@example.com
```

Superuser command notes: [docs/superuser-access.md](docs/superuser-access.md)

## Notes

- Route handlers should use `apiHandler` from `src/lib/api/helpers.ts`.
- Request schemas live with their feature module in `src/lib/features/*/schemas.ts`.
- Import core infrastructure from `@/lib/core/*` (prisma, logger, request-context).
