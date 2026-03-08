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
- Shared API schemas: `src/lib/api/schemas.ts`
- Prisma client: `src/lib/db/prisma.ts`

Backend contributor/agent guide:

- [Backend Agent Guide](docs/backend-agent-guide.md)

## Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Notes

- Route handlers should use `apiHandler`, `parseJsonBody`, and `validateBody`.
- API request/response contracts should be defined in `src/lib/api/schemas.ts`.
- Use public imports from `@/lib/*` wrappers, not `@/lib/core/*`.
