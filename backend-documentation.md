# Travel Pro — Backend Documentation

> **Purpose:** Comprehensive reference for evaluating the backend architecture, identifying gaps, and planning improvements.
> Generated from a full code audit on 2026-02-19.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Middleware & Rate Limiting](#4-middleware--rate-limiting)
5. [API Route Reference](#5-api-route-reference)
6. [AI Generation Pipeline](#6-ai-generation-pipeline)
7. [Flight Optimization (Amadeus)](#7-flight-optimization-amadeus)
8. [Enrichment Services](#8-enrichment-services)
9. [Email System](#9-email-system)
10. [Affiliate Tracking](#10-affiliate-tracking)
11. [PDF Export](#11-pdf-export)
12. [Shared Infrastructure & Utilities](#12-shared-infrastructure--utilities)
13. [Error Handling Patterns](#13-error-handling-patterns)
14. [Environment Variables](#14-environment-variables)
15. [Known Limitations & Gaps](#15-known-limitations--gaps)

---

## 1. Architecture Overview

### Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Server Components + API Routes |
| Runtime | Node.js (Vercel) | 60s max duration (Pro plan) |
| Database | PostgreSQL (Supabase) | Prisma v7 ORM |
| Auth | Supabase Auth | Email/password, cookie-based sessions |
| AI | Anthropic SDK | Claude Haiku for generation |
| Cache | Upstash Redis | Rate limiting + weather cache |
| Email | Resend | React Email templates |
| Flights | Amadeus API | Price optimization (optional) |
| Maps | MapLibre GL + Mapbox tiles | Client-side rendering |
| PDF | @react-pdf/renderer | Server-side generation |

### File Structure (Backend Only)

```
src/
├── app/api/
│   ├── generate/               # Phase 0 direct generation
│   │   ├── route.ts            # POST — full itinerary generation
│   │   └── select-route/
│   │       └── route.ts        # POST — Haiku city/route selection
│   ├── health/
│   │   └── route.ts            # GET — env health check
│   └── v1/
│       ├── trips/
│       │   ├── route.ts        # GET (list), POST (create)
│       │   └── [id]/
│       │       ├── route.ts    # GET, PATCH, DELETE
│       │       ├── generate/
│       │       │   └── route.ts  # POST — SSE generation stream
│       │       ├── optimize/
│       │       │   └── route.ts  # POST — Amadeus flight optimization
│       │       └── share/
│       │           └── route.ts  # GET — generate share token
│       ├── profile/
│       │   ├── route.ts        # GET, PATCH, DELETE
│       │   └── export/
│       │       └── route.ts    # GET — GDPR data export
│       └── affiliate/
│           └── redirect/
│               └── route.ts    # GET — click tracking + 302 redirect
├── lib/
│   ├── ai/                     # AI generation pipeline
│   │   ├── pipeline.ts         # Main orchestration
│   │   ├── enrichment.ts       # Visa + weather enrichment
│   │   ├── validator.ts        # Post-generation quality checks
│   │   ├── model-selector.ts   # Multi-model routing (future)
│   │   └── prompts/
│   │       ├── v1.ts           # Multi-city system prompt + assembly
│   │       ├── v2.ts           # Advanced prompt (not active)
│   │       ├── single-city.ts  # Single-city prompt
│   │       └── route-selector.ts  # Haiku route selection prompt
│   ├── api/
│   │   ├── helpers.ts          # ApiError, auth guards, apiHandler wrapper
│   │   └── schemas.ts          # Zod validation schemas
│   ├── db/
│   │   └── prisma.ts           # Lazy-init PrismaClient (Proxy pattern)
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server-side client + getAuthenticatedUserId()
│   ├── flights/
│   │   ├── amadeus.ts          # Amadeus API client (OAuth2, cached)
│   │   ├── optimizer.ts        # Multi-city flight date optimization
│   │   ├── city-iata-map.ts    # ~340 city → IATA code lookup
│   │   └── types.ts            # Flight type definitions
│   ├── affiliate/
│   │   └── link-generator.ts   # Skyscanner/Booking.com/GetYourGuide URLs
│   ├── email/
│   │   ├── index.ts            # Resend client + send functions
│   │   └── templates/
│   │       ├── EmailLayout.tsx
│   │       ├── welcome.tsx
│   │       ├── itinerary-ready.tsx
│   │       └── shared-itinerary.tsx
│   ├── export/
│   │   └── pdf-generator.tsx   # @react-pdf document component
│   └── utils/
│       ├── date.ts             # daysBetween, addDays, formatDateShort
│       ├── error.ts            # getErrorMessage
│       ├── status-helpers.ts   # statusBadge, statusLabel
│       ├── derive-city-budget.ts  # Per-city budget breakdown
│       ├── generate-packing-list.ts  # Context-aware packing list
│       ├── country-flags.ts    # ISO code → flag emoji
│       └── trip-metadata.ts    # getUniqueCountries, getTripTitle, getBudgetStatus
├── middleware.ts               # Auth protection + rate limiting
└── types/index.ts              # All TypeScript type definitions
```

### Initialization Pattern

All external service clients use **lazy initialization** to prevent build-time crashes when environment variables are missing:

| Service | Pattern | File |
|---------|---------|------|
| Prisma | `Proxy` on named export; client created on first property access | `src/lib/db/prisma.ts` |
| Redis | `getRedis()` returns `null` if env vars missing | `src/lib/ai/enrichment.ts` |
| Resend | `getResend()` returns `null` + logs warning | `src/lib/email/index.ts` |
| Amadeus | Token fetch returns `null` if credentials missing | `src/lib/flights/amadeus.ts` |
| Anthropic | Checked at request time in API route handlers | `src/app/api/generate/route.ts` |

---

## 2. Database Schema

**ORM:** Prisma v7
**Provider:** PostgreSQL (Supabase)
**Config:** `prisma.config.ts` (datasource URL loaded from `.env.local`, NOT in `schema.prisma`)
**Schema:** `prisma/schema.prisma`

### 2.1 Entity-Relationship Diagram

```
Profile (1) ──→ (n) Trip ──→ (n) Itinerary ──→ (n) ItineraryEdit
                  │
                  └──→ (n) AffiliateClick

Experiment (1) ──→ (n) ExperimentAssignment

AnalyticsEvent (standalone)
```

### 2.2 Models

#### Profile (`profiles`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PK, auto | Primary key |
| `userId` | String | **unique** | Supabase auth user ID |
| `nationality` | String | required | Passport country (e.g., "German") |
| `homeAirport` | String | required | IATA code (e.g., "LEJ") |
| `travelStyle` | String | required | `"backpacker"` / `"comfort"` / `"luxury"` |
| `interests` | String[] | required | Max 10 tags |
| `activityLevel` | String? | optional | `"low"` / `"moderate"` / `"high"` |
| `languagesSpoken` | String[] | required | Language codes/names |
| `onboardingCompleted` | Boolean | default: false | Onboarding flag |
| `createdAt` | DateTime | auto | |
| `updatedAt` | DateTime | auto | |

**Relations:** Profile → many Trips

#### Trip (`trips`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PK, auto | Primary key |
| `profileId` | String? | optional FK | Null for guest trips |
| `tripType` | String | default: "multi-city" | `"single-city"` / `"multi-city"` |
| `region` | String | default: "" | Geographic region |
| `destination` | String? | optional | Single-city destination |
| `destinationCountry` | String? | optional | Country name |
| `destinationCountryCode` | String? | optional | ISO 2-letter code |
| `dateStart` | String | required | YYYY-MM-DD |
| `dateEnd` | String | required | YYYY-MM-DD |
| `flexibleDates` | Boolean | default: false | |
| `budget` | Int | required | EUR |
| `vibe` | String | required | `"relaxation"` / `"adventure"` / `"cultural"` / `"mix"` |
| `travelers` | Int | default: 2 | |
| `shareToken` | String? | **unique** | 12-char base64url token |
| `createdAt` | DateTime | auto | |

**Relations:** Trip → many Itineraries, Trip → many AffiliateClicks

#### Itinerary (`itineraries`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PK, auto | Primary key |
| `tripId` | String | FK (cascade) | |
| `data` | Json | required | Complete `Itinerary` object (route + days + budget + visa + weather) |
| `version` | Int | default: 1 | Increments on regeneration |
| `isActive` | Boolean | default: true | Only one active per trip |
| `promptVersion` | String | default: "v1" | Template version used |
| `generationStatus` | String | default: "pending" | `"pending"` / `"generating"` / `"complete"` / `"failed"` |
| `generationJobId` | String? | optional | External job tracking |
| `createdAt` | DateTime | auto | |
| `updatedAt` | DateTime | auto | |

**Relations:** Itinerary → many ItineraryEdits

**Critical:** `tripId` is NOT unique. Multiple itinerary versions exist per trip. Always double-cast JSON: `data as unknown as Itinerary`.

#### ItineraryEdit (`itinerary_edits`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PK, auto | |
| `itineraryId` | String | FK (cascade) | |
| `editType` | String | required | `"adjust_days"` / `"remove_city"` / `"reorder_cities"` / `"add_city"` / `"regenerate_activities"` |
| `editPayload` | Json | required | Edit details |
| `description` | String? | optional | Human-readable description |
| `createdAt` | DateTime | auto | |

**Purpose:** Audit log for all itinerary edits.

#### Experiment (`experiments`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PK | |
| `name` | String | **unique** | Experiment identifier |
| `variants` | String[] | required | Variant names |
| `isActive` | Boolean | default: true | |
| `createdAt` | DateTime | auto | |

#### ExperimentAssignment (`experiment_assignments`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PK | |
| `experimentId` | String | FK (cascade) | |
| `userId` | String | required | |
| `variant` | String | required | |
| `createdAt` | DateTime | auto | |

**Unique:** `(experimentId, userId)` — one assignment per user per experiment.

#### AnalyticsEvent (`analytics_events`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PK | |
| `userId` | String? | optional, indexed | |
| `eventName` | String | required, indexed | |
| `properties` | Json | default: {} | Event metadata |
| `sessionId` | String? | optional | Guest tracking |
| `createdAt` | DateTime | auto, indexed | |

#### AffiliateClick (`affiliate_clicks`)

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PK | |
| `tripId` | String? | optional FK (SetNull), indexed | |
| `provider` | String | required | `"skyscanner"` / `"booking"` / `"getyourguide"` |
| `clickType` | String | required | `"flight"` / `"hotel"` / `"activity"` |
| `city` | String? | optional | Context |
| `destination` | String? | optional | Context |
| `url` | String | required | Full URL |
| `userId` | String? | optional | |
| `sessionId` | String? | optional | |
| `ipHash` | String? | optional | SHA256-hashed IP (first 16 chars) |
| `createdAt` | DateTime | auto, indexed | |

### 2.3 Itinerary Versioning Pattern

```
WRONG (tripId is NOT unique):
  prisma.itinerary.upsert({ where: { tripId }, ... })

CORRECT:
  1. prisma.itinerary.updateMany({ where: { tripId, isActive: true }, data: { isActive: false } })
  2. prisma.itinerary.create({ data: { tripId, data, version: old + 1, isActive: true } })
```

### 2.4 Seed Data

File: `prisma/seed.ts`

- Demo profile: German traveler, comfort style, LEJ airport
- Demo trip: Asia, Mar 15 – Apr 5 2025, €10,000, 2 travelers
- Demo itinerary: 7 cities (Tokyo → Kyoto → Hanoi → Ha Long Bay → Bangkok → Chiang Mai → Phuket), 22 days
- Demo share token: `demo-share-token-001`

---

## 3. Authentication & Authorization

### 3.1 Auth Provider

**Supabase Auth** with email/password. Cookie-based sessions managed via `@supabase/ssr`.

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser-side Supabase client (uses `NEXT_PUBLIC_*` vars) |
| `src/lib/supabase/server.ts` | Server-side client (reads/writes cookies via `next/headers`) |
| `src/app/auth/callback/route.ts` | OAuth callback handler |

### 3.2 Server-Side Auth Flow

```
Request → middleware.ts (session refresh via Supabase)
       → API route handler
       → requireAuth() → getAuthenticatedUserId() → supabase.auth.getUser()
       → Returns userId or throws ApiError(401)
```

### 3.3 Auth Guards (`src/lib/api/helpers.ts`)

| Guard | Returns | Throws |
|-------|---------|--------|
| `requireAuth()` | `userId: string` | `ApiError(401)` |
| `requireProfile(userId)` | `Profile` object | `ApiError(404)` |
| `requireTripOwnership(tripId, profileId)` | `Trip` object | `ApiError(403)` or `ApiError(404)` |

### 3.4 Route Protection Matrix

| Route | Auth Required | Notes |
|-------|--------------|-------|
| `GET /api/v1/trips` | Yes | List user's trips |
| `POST /api/v1/trips` | No (auto-link if logged in) | Guests can create trips |
| `GET /api/v1/trips/[id]` | No | Public read |
| `PATCH /api/v1/trips/[id]` | Yes + ownership | Edit itinerary |
| `DELETE /api/v1/trips/[id]` | Yes + ownership | Cascade delete |
| `POST /api/v1/trips/[id]/generate` | No | Public generation (rate-limited) |
| `POST /api/v1/trips/[id]/optimize` | Yes + ownership | Amadeus flight search |
| `GET /api/v1/trips/[id]/share` | Yes + ownership | Generate share token |
| `GET /api/v1/trips/shared/[token]` | No | Public shared view |
| `GET /api/v1/profile` | Yes | Fetch profile |
| `PATCH /api/v1/profile` | Yes | Upsert profile |
| `DELETE /api/v1/profile` | Yes | GDPR account deletion |
| `GET /api/v1/profile/export` | Yes | GDPR data export |
| `POST /api/generate` | No | Phase 0 direct generation |
| `POST /api/generate/select-route` | No | Phase 0 route selection |
| `GET /api/v1/affiliate/redirect` | No | Click tracking + redirect |
| `GET /api/health` | No | Health check |

### 3.5 Account Deletion (GDPR)

`DELETE /api/v1/profile`:
1. Deletes all Prisma data (profile → trips → itineraries → edits via cascade)
2. Deletes Supabase auth user via admin API (`SUPABASE_SERVICE_ROLE_KEY`)

---

## 4. Middleware & Rate Limiting

**File:** `src/middleware.ts`

### 4.1 Middleware Flow

```
1. Skip static files, _next, public assets
2. Refresh Supabase session (cookie update)
3. Protected route check (/dashboard, /profile → redirect to /login if unauthenticated)
4. Rate limit check (API routes only, via Upstash Redis)
5. Pass through
```

### 4.2 Rate Limiting

**Implementation:** Upstash Redis sliding window (ZADD + ZREMRANGEBYSCORE + ZCARD)

| Route Pattern | Limit | Window | Purpose |
|---------------|-------|--------|---------|
| `/api/v1/trips/*/generate` | 5 | 1 hour | LLM cost protection |
| `/api/v1/trips/shared/*` | 60 | 1 minute | Public share abuse |
| `/api/v1/*` (unauthenticated) | 30 | 1 minute | General API |
| `/api/v1/*` (authenticated) | 100 | 1 minute | Higher limit for users |
| `/api/generate` | 10 | 1 minute | Phase 0 generation (in-route) |
| `/api/generate/select-route` | 10 | 1 minute | Phase 0 route selection (in-route) |

**Fail-open:** If Redis is unavailable, requests pass through with a logged warning.

**IP detection:** `x-forwarded-for` header, falling back to `x-real-ip`.

**Response on limit exceeded:** HTTP 429 with `Retry-After` header.

### 4.3 Additional Rate Limiter

`GET /api/v1/trips/shared/[token]` has an **in-memory** rate limiter (Map-based, 60 req/min per IP) as a secondary defense layer. This is per-process only and not distributed.

---

## 5. API Route Reference

### 5.1 Phase 0 — Direct Generation

#### `POST /api/generate`

**Purpose:** Generate a full itinerary in a single request (no DB persistence required).

**Request:**
```json
{
  "profile": {
    "nationality": "German",
    "homeAirport": "MUC",
    "travelStyle": "comfort",
    "interests": ["history", "food"]
  },
  "tripIntent": {
    "id": "trip-abc",
    "tripType": "multi-city",
    "region": "Southeast Asia",
    "dateStart": "2025-10-15",
    "dateEnd": "2025-11-05",
    "flexibleDates": false,
    "budget": 10000,
    "vibe": "cultural",
    "travelers": 2
  },
  "cities": null
}
```

**Response (200):**
```json
{
  "success": true,
  "itinerary": {
    "route": [...],
    "days": [...],
    "budget": { "flights": 2800, "accommodation": 3200, ... },
    "visaData": [...],
    "weatherData": [...]
  }
}
```

**Notes:**
- Rate limiting skipped if `cities` is provided (already limited on `/select-route`).
- 60s max duration. Calls full AI pipeline internally.
- Best-effort DB persist (non-blocking, non-fatal).

#### `POST /api/generate/select-route`

**Purpose:** Haiku selects optimal cities for a multi-city trip. Single-city trips return the destination immediately.

**Response (200):**
```json
{
  "cities": [
    { "id": "tokyo", "city": "Tokyo", "country": "Japan", "countryCode": "JP", "iataCode": "NRT", "lat": 35.68, "lng": 139.69, "minDays": 3, "maxDays": 5 },
    ...
  ]
}
```

**Fallback:** Returns `{ "cities": null }` if Haiku route selection fails (graceful degradation).

### 5.2 Trip CRUD

#### `GET /api/v1/trips` — List Trips (auth required)

Returns all trips for the authenticated user, sorted by `createdAt` desc. Includes only active itinerary metadata (id, version, status) per trip.

#### `POST /api/v1/trips` — Create Trip (auth optional)

Creates a trip record. Auto-links to user profile if authenticated. Guests get `profileId: null`.

**Request:**
```json
{
  "tripType": "multi-city",
  "region": "Asia",
  "dateStart": "2025-10-15",
  "dateEnd": "2025-11-05",
  "budget": 10000,
  "vibe": "cultural",
  "travelers": 2
}
```

**Response:** 201 with trip object.

#### `GET /api/v1/trips/[id]` — Get Trip (public)

Returns trip + active itinerary (latest version). No auth required.

#### `PATCH /api/v1/trips/[id]` — Edit Trip (auth + ownership)

Logs the edit to `ItineraryEdit` table. If `data` field is provided, creates a new itinerary version (deactivates previous).

**Request:**
```json
{
  "editType": "reorder_cities",
  "editPayload": { "newOrder": ["kyoto", "tokyo", "osaka"] },
  "description": "Moved Kyoto before Tokyo",
  "data": { "route": [...], "days": [...], "budget": {...} }
}
```

#### `DELETE /api/v1/trips/[id]` — Delete Trip (auth + ownership)

Cascade deletes trip → itineraries → edits.

### 5.3 Generation (SSE)

#### `POST /api/v1/trips/[id]/generate`

**Purpose:** Generate itinerary for a saved trip. Returns Server-Sent Events stream.

**Request:**
```json
{
  "profile": { "nationality": "German", "homeAirport": "MUC", "travelStyle": "comfort", "interests": ["history"] },
  "promptVersion": "v1"
}
```

**SSE Events:**
```
data: {"stage":"route","message":"Optimising your route...","pct":15}
data: {"stage":"activities","message":"Planning daily activities...","pct":35}
data: {"stage":"visa","message":"Checking visa requirements...","pct":55}
data: {"stage":"weather","message":"Analysing weather patterns...","pct":70}
data: {"stage":"budget","message":"Calculating your budget...","pct":85}
data: {"stage":"done","message":"Your trip is ready!","pct":100,"itinerary_id":"...","trip_id":"..."}
```

**Error Event:**
```
data: {"stage":"error","message":"Generation failed. Please try again.","pct":0}
```

**Workflow:**
1. Creates itinerary record with `generationStatus: "generating"`
2. Streams progress events (some with artificial delays for UX)
3. Calls `generateItinerary()` pipeline
4. On success: updates itinerary, deactivates old versions
5. On error: updates status to `"failed"`, sends error event

**Rate limit:** 5 requests/hour per IP (strictest in the system).

### 5.4 Flight Optimization

#### `POST /api/v1/trips/[id]/optimize` (auth + ownership)

**Purpose:** Find cheapest flight combination across flexible city-day ranges using Amadeus API.

**Request:**
```json
{
  "homeAirport": "MUC",
  "route": [{ "id": "tokyo", "city": "Tokyo", ... }],
  "dateStart": "2025-10-15",
  "dateEnd": "2025-11-05",
  "travelers": 2
}
```

**Response:** Flight skeleton with per-leg pricing.

**Notes:** Resolves missing IATA codes from static `city-iata-map.ts`. Returns 400 if any city can't be resolved.

### 5.5 Sharing

#### `GET /api/v1/trips/[id]/share` (auth + ownership)

Generates a 12-char base64url share token (idempotent — returns existing if present).

**Response:**
```json
{
  "shareToken": "abc123def456",
  "shareUrl": "https://travelpro.app/share/abc123def456"
}
```

#### `GET /api/v1/trips/shared/[token]` (public)

Returns public trip metadata + itinerary data. Strips private fields (no profileId, no user data).

### 5.6 Profile

#### `GET /api/v1/profile` (auth)

Returns full profile object.

#### `PATCH /api/v1/profile` (auth)

Upserts profile. Partial updates supported — only provided fields are changed.

**Defaults on create:** nationality: "German", travelStyle: "comfort", interests: [], homeAirport: "".

#### `DELETE /api/v1/profile` (auth)

GDPR account deletion. Deletes all Prisma data + Supabase auth user.

#### `GET /api/v1/profile/export` (auth)

GDPR data export. Returns all user data as JSON (profile + trips + itineraries + edits).

### 5.7 Affiliate Redirect

#### `GET /api/v1/affiliate/redirect`

**Query params:** `provider`, `type`, `dest`, `itinerary_id?`, `city?`

**Domain whitelist:** `skyscanner.net`, `skyscanner.com`, `booking.com`, `getyourguide.com`

**Flow:**
1. Validates destination URL against whitelist
2. Hashes client IP (SHA256, first 16 chars)
3. Asynchronously logs click to `AffiliateClick` (non-blocking)
4. Returns 302 redirect to destination

### 5.8 Health Check

#### `GET /api/health`

Returns 200 if all env vars present, 207 if any missing. Checks: `ANTHROPIC_API_KEY`, Supabase vars, `DATABASE_URL`.

---

## 6. AI Generation Pipeline

**File:** `src/lib/ai/pipeline.ts`

### 6.1 Pipeline Overview

```
Input: UserProfile + TripIntent + optional CityWithDays[]
                    │
    ┌───────────────┴───────────────┐
    │                               │
Multi-city                    Single-city
    │                               │
    ▼                               │
Stage A: selectRoute()              │
(Haiku, 1.2k tokens)               │
    │                               │
    ▼                               │
CityWithDays[] (4–7 cities)         │
    │                               │
    └───────────────┬───────────────┘
                    │
                    ▼
Stage 1: Prompt Assembly
  - assemblePrompt() (v1) for multi-city
  - assembleSingleCityPrompt() for single-city
                    │
                    ▼
Stage 2: Claude Haiku API Call
  - Model: claude-haiku-4-5-20251001
  - Temp: 0.7
  - Max tokens: 10,000 (multi) / 4,000 (single)
  - SDK timeout: 50s
  - Content filter retry: 2x with backoff
                    │
                    ▼
Stage 3: Parse + Validate
  - extractJSON(): strip markdown fences, find JSON
  - Zod schema validation
  - validateItinerary(): completeness + route + budget checks
                    │
                    ▼
Stage 4: Enrichment (parallel)
  ┌─────────────────┴─────────────────┐
  │                                   │
enrichVisa()                    enrichWeather()
(Passport Index,                (Open-Meteo Archive API,
 static 199×227 matrix)         Redis cached, 7d TTL,
                                 5s timeout with fallback)
  │                                   │
  └─────────────────┬─────────────────┘
                    │
                    ▼
Stage 5: Combine + Persist
  - Merge route, days, budget, visaData, weatherData
  - Best-effort Prisma persist (non-blocking)
                    │
                    ▼
Output: Itinerary object
```

### 6.2 Route Selection (`src/lib/ai/prompts/route-selector.ts`)

**Function:** `selectRoute(profile, intent)`

- Calculates sightseeing days: `totalDays × 0.7`
- Calls Haiku (1,200 max tokens) to pick 4–7 cities in geographic order
- Returns `CityWithDays[]` with IATA codes, lat/lng, min/max day ranges
- Graceful failure: if selection fails, pipeline continues without pre-selected cities

### 6.3 Prompt Templates

| Template | File | System Prompt | Used In |
|----------|------|--------------|---------|
| v1 (multi-city) | `prompts/v1.ts` | Multi-country trip expert, JSON-only output | Active — multi-city generation |
| Single-city | `prompts/single-city.ts` | Expert city guide, neighborhood rotation | Active — single-city generation |
| v2 (advanced) | `prompts/v2.ts` | Chain-of-thought, "Travel Pro 7" standard | **Not active** (future enhancement) |
| Route selector | `prompts/route-selector.ts` | City picker (JSON array output) | Active — multi-city route selection |

**Prompt assembly** injects:
- Traveler profile (nationality, airport, style, interests)
- Trip parameters (region/destination, dates, budget, vibe, travelers)
- Optional flight skeleton (if Amadeus optimization ran first)
- Optional pre-selected cities (if route selection succeeded)
- JSON output structure example

### 6.4 Validation (`src/lib/ai/validator.ts`)

**Function:** `validateItinerary(itinerary, budgetCeiling)`

**Checks:**

| Check | Type | Rule |
|-------|------|------|
| Activity completeness | Error | All 8 fields required: name, category, icon, why, duration, tip, food, cost |
| Route not empty | Error | At least 1 city |
| Duplicate cities | Warning | Same city name appearing twice |
| Route backtracking | Warning | Same country visited non-consecutively |
| Budget sum | Warning | Total should = sum of components |
| Budget ceiling | Warning | Total should not exceed ceiling by > 5% |
| Days array | Error | Must be non-empty |

**Returns:** `{ valid: boolean, warnings: string[], errors: string[], missingFields: MissingField[] }`

**Note:** `buildRetryPrompt()` exists for generating targeted correction prompts, but is not currently used in the pipeline.

### 6.5 Model Selector (`src/lib/ai/model-selector.ts`)

**Status:** Defined but **not used** in Phase 1. All generation uses Haiku directly.

| Task | Model | Max Tokens | Temperature |
|------|-------|-----------|-------------|
| `full_itinerary` | Sonnet | 8,000 | 0.4 |
| `city_activities` | Haiku | 2,000 | 0.5 |
| `single_day_regen` | Haiku | 1,000 | 0.5 |
| `budget_recalc` | Haiku | 500 | 0.1 |

### 6.6 Error Handling & Resilience

| Scenario | Handling |
|----------|---------|
| Content filtering block | Retry 2x with backoff (600ms, 1.2s) |
| Token truncation (`max_tokens` stop) | Throw error (increase token budget) |
| Route selection failure | Log warning, continue without pre-selected cities |
| Weather API timeout (>5s) | Return neutral fallback: 25°C, "Warm", ☀️ |
| Visa passport not in index | Return generic: "visa-required", "Check embassy" |
| DB persist failure | Catch + log, return itinerary to user anyway |

---

## 7. Flight Optimization (Amadeus)

**Files:** `src/lib/flights/amadeus.ts`, `src/lib/flights/optimizer.ts`

### 7.1 Amadeus Client

- **Auth:** OAuth2 client credentials grant
- **Token caching:** Upstash Redis (TTL = expires_in - 60s)
- **Search:** `GET /v2/shopping/flight-offers` → cheapest of top 5 results
- **Result caching:** Redis, 2-hour TTL per origin/dest/date/adults combo
- **Environments:** test (`test.api.amadeus.com`) or production (`api.amadeus.com`)
- **Fail-open:** Returns `null` if credentials missing or API unavailable

### 7.2 Flight Optimizer

**Problem:** Given a multi-city trip with flexible day ranges per city, find the day assignment that minimizes total flight cost.

**Algorithm:**
1. Generate all feasible day assignments (recursive, pruning invalid branches)
2. Pre-fetch flight prices in parallel for all possible departure dates
3. Evaluate each assignment: sum outbound + inter-city + return flight costs
4. Return cheapest valid assignment

**Output (`FlightSkeleton`):**
```typescript
{
  homeIata: "MUC",
  legs: [
    { fromCity: "Munich", toCity: "Tokyo", fromIata: "MUC", toIata: "NRT", departureDate: "2025-10-15", price: 650, duration: "12h 30m", airline: "LH" },
    ...
  ],
  totalFlightCost: 2800,
  dayAssignment: [4, 3, 3, 2, 3, 3, 4],
  baselineCost: 3200
}
```

### 7.3 City-IATA Lookup

**File:** `src/lib/flights/city-iata-map.ts`

~340 city-to-IATA mappings covering major travel destinations worldwide. Handles alternate spellings (e.g., "Ho Chi Minh City" and "Saigon" → SGN). Used as fallback when the AI doesn't populate IATA codes.

---

## 8. Enrichment Services

### 8.1 Visa Enrichment (`src/lib/ai/enrichment.ts`)

**Data source:** Passport Index static dataset (`src/data/visa-index.ts`, 886KB)
- 199 passports × 199+ destinations (~39,601 pairs)
- Source: [passport-index-data](https://github.com/imorte/passport-index-data) (MIT)

**Supporting data:**
- `src/data/nationality-to-iso2.ts` — "German" → "DE"
- `src/data/visa-official-urls.ts` — "JP" → official immigration URL

**Requirement mapping:**

| Raw Value | Enum | Max Stay | Icon |
|-----------|------|----------|------|
| "-1" | visa-free | 365d | 🏠 (home country) |
| "no admission" | no-admission | 0 | 🚫 |
| "visa required" | visa-required | 0 | 🛂 |
| "visa on arrival" | visa-on-arrival | 30d | 🛬 |
| "e-visa" | e-visa | 30d | 💻 |
| "eta" | eta | 90d | 📱 |
| Numeric (e.g., "90") | visa-free | N days | ✅ |
| "visa free" | visa-free | 0 | ✅ |

### 8.2 Weather Enrichment (`src/lib/ai/enrichment.ts`)

**Data source:** Open-Meteo Archive API (historical weather from previous calendar year, same month)

**Flow:**
1. Check Redis cache (`weather:{lat}:{lng}:{month}`, 7-day TTL)
2. If miss: call `archive-api.open-meteo.com/v1/archive` (5s timeout)
3. Calculate avg max/min temp and avg precipitation
4. Derive condition (Rainy / Hot & humid / Tropical / Warm / Mild / Cool / Cold)
5. Cache result in Redis

**Fallback on any failure:** `{ temp: "25°C", condition: "Warm", icon: "☀️" }`

---

## 9. Email System

**File:** `src/lib/email/index.ts`

### 9.1 Client

Resend SDK, lazily initialized. Returns `null` with warning if `RESEND_API_KEY` not set.

**From address:** `hello@travelpro.app`

### 9.2 Templates

| Template | Trigger | Subject | CTA |
|----------|---------|---------|-----|
| Welcome | Post-onboarding | "Welcome to Travel Pro — your first trip is waiting" | Start Planning → `/plan` |
| Itinerary Ready | Generation complete | "Your {destination} itinerary is ready ✈" | View Itinerary → `/trip/{id}` |
| Shared Itinerary | User shares trip | "{senderName} wants to travel with you ✈" | View Itinerary → `/share/{token}` |

**Design:** Teal (#0D7377) header, Inter/Helvetica font, 600px max width, optional privacy link footer.

### 9.3 Current Usage

Email sending functions exist but are **not called from any API route** in the current codebase. The infrastructure is ready but integration points are not wired up.

---

## 10. Affiliate Tracking

### 10.1 Link Generator (`src/lib/affiliate/link-generator.ts`)

| Provider | Link Builder | URL Pattern |
|----------|-------------|------------|
| Skyscanner | `buildFlightLink()` | `skyscanner.net/transport/flights/{from}/{to}/{date}` |
| Booking.com | `buildHotelLink()` | `booking.com/searchresults.html?ss={city}&checkin=...` |
| GetYourGuide | `buildActivityLink()` | `getyourguide.com/s/?q={city+activity}` |

**Tracked links:** `buildTrackedLink()` wraps destination in `/api/v1/affiliate/redirect?provider=...&dest=...` for server-side click logging before redirect.

### 10.2 Redirect Endpoint

`GET /api/v1/affiliate/redirect`:
1. Validate query params (provider, type, dest URL)
2. Check dest URL domain against whitelist
3. Hash client IP (SHA256, 16 chars) for GDPR
4. Async-log `AffiliateClick` to Prisma (non-blocking)
5. 302 redirect to destination

---

## 11. PDF Export

**File:** `src/lib/export/pdf-generator.tsx`

**Component:** `TripPDFDocument` (React component for `@react-pdf/renderer`)

**Document structure:**
1. Header: Teal bar, "Travel Pro" + generation date (every page)
2. Mapbox static map with route pins
3. Trip title + subtitle
4. Route overview (numbered cities with days)
5. Day-by-day activity table
6. Visa requirements table
7. Weather overview table
8. Budget breakdown
9. Booking links (affiliate)
10. Footer: page numbers (every page)

**Rendering:** Called client-side via `PDFDownloadButton` component. Falls back to sample data if props missing.

---

## 12. Shared Infrastructure & Utilities

### 12.1 API Handler Wrapper (`apiHandler`)

```typescript
function apiHandler(routeName: string, handler: Function) {
  return async (req, ctx) => {
    try {
      const params = ctx?.params ? await ctx.params : {};
      return await handler(req, params);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message, details: err.details }, { status: err.status });
      }
      console.error(`[${routeName}]`, err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
```

- Resolves Next.js 16 async `params: Promise<{...}>`
- Catches `ApiError` → structured JSON response
- Catches unknown errors → 500 with logging

### 12.2 Validation Schemas (`src/lib/api/schemas.ts`)

| Schema | Used By | Validation Rules |
|--------|---------|-----------------|
| `ProfileInputSchema` | Profile PATCH, generation | nationality (1-100), homeAirport (2-100), travelStyle enum, interests (max 10 × 50 chars) |
| `TripIntentInputSchema` | Trip creation, generation | Refinement: multi-city requires region, single-city requires destination. Budget 1–1M, travelers 1–20. |
| `CityWithDaysInputSchema` | Route selection output | id, city, country, countryCode, iataCode, lat, lng, minDays, maxDays |

### 12.3 Utility Functions

| Module | Functions | Purpose |
|--------|----------|---------|
| `utils/date.ts` | `daysBetween()`, `addDays()`, `formatDateShort()` | Date math (UTC-safe) |
| `utils/error.ts` | `getErrorMessage()` | Safe error message extraction |
| `utils/status-helpers.ts` | `statusBadge()`, `statusLabel()` | Generation status → UI labels |
| `utils/derive-city-budget.ts` | `deriveCityBudgets()`, `parseCostString()` | Per-city budget breakdown from itinerary |
| `utils/generate-packing-list.ts` | `generatePackingList()` | Context-aware packing list (weather, destination, duration) |
| `utils/country-flags.ts` | `countryCodeToFlag()` | ISO code → flag emoji |
| `utils/trip-metadata.ts` | `getUniqueCountries()`, `getTripTitle()`, `getBudgetStatus()` | Trip metadata helpers |

### 12.4 Active Itinerary Include

Reusable Prisma include fragment for fetching only the latest active itinerary:

```typescript
const ACTIVE_ITINERARY_INCLUDE = {
  itineraries: {
    where: { isActive: true },
    orderBy: { version: "desc" },
    take: 1,
  }
};
```

---

## 13. Error Handling Patterns

### 13.1 API Error Class

```typescript
class ApiError extends Error {
  constructor(
    public status: number,    // HTTP status code
    message: string,
    public details?: unknown  // Zod validation errors, etc.
  )
}
```

Used across all API routes. Caught by `apiHandler` wrapper and serialized to JSON.

### 13.2 Error Response Format

```json
{
  "error": "Human-readable error message",
  "details": { ... }
}
```

`details` is optional and typically contains Zod field-level errors.

### 13.3 Resilience Strategy

| Layer | Strategy |
|-------|---------|
| Rate limiting (Redis) | Fail-open: requests pass through if Redis unavailable |
| Weather enrichment | Fail-open: neutral fallback (25°C, Warm) |
| Visa enrichment | Fail-open: generic "Check embassy" fallback |
| Flight search (Amadeus) | Fail-open: returns null, optimizer handles gracefully |
| DB persistence | Fail-open: best-effort, non-blocking |
| Email sending | Fail-open: no-op if Resend key missing |
| Content filtering | Retry 2x with backoff, then throw |

---

## 14. Environment Variables

### 14.1 Required

| Variable | Used By | Purpose |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | AI pipeline | Claude API authentication |
| `DATABASE_URL` | Prisma | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Account deletion | Supabase admin operations |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | MapLibre, PDF | Map tiles + static map images |
| `NEXT_PUBLIC_APP_URL` | Share links, emails | Base URL for generated links |

### 14.2 Required for Rate Limiting & Caching

| Variable | Used By | Fallback |
|----------|---------|----------|
| `UPSTASH_REDIS_REST_URL` | Middleware, weather cache, Amadeus cache | Rate limiting disabled, weather uncached |
| `UPSTASH_REDIS_REST_TOKEN` | Middleware, weather cache, Amadeus cache | Same |

### 14.3 Optional

| Variable | Used By | Fallback |
|----------|---------|----------|
| `RESEND_API_KEY` | Email system | Emails silently skipped |
| `AMADEUS_API_KEY` | Flight optimization | Flight searches return null |
| `AMADEUS_API_SECRET` | Flight optimization | Flight searches return null |
| `AMADEUS_ENVIRONMENT` | Amadeus client | Defaults to "test" |
| `BOOKING_AFFILIATE_ID` | Affiliate links | Uses placeholder ID |
| `GYG_PARTNER_ID` | Affiliate links | Uses placeholder ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics (client-side) | Analytics disabled |
| `NEXT_PUBLIC_POSTHOG_HOST` | Analytics (client-side) | Analytics disabled |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking | Error tracking disabled |

---

## 15. Known Limitations & Gaps

### 15.1 Unused Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Prompt v2 (chain-of-thought) | Defined, not wired | `prompts/v2.ts` exists but pipeline always uses v1 |
| Model selector | Defined, not used | All generation uses Haiku directly; Sonnet routing unused |
| Validator retry prompt | Defined, not called | `buildRetryPrompt()` exists but validation errors are surfaced to user, not auto-retried |
| Email sending | Templates exist, not called | `sendWelcomeEmail()` and `sendItineraryReadyEmail()` are defined but not invoked from any API route |
| Experiment/Assignment models | DB schema exists | No API routes or logic consume A/B test data |
| AnalyticsEvent model | DB schema exists | No API routes write to this table |

### 15.2 Architectural Gaps

| Gap | Impact | Severity |
|-----|--------|----------|
| No input sanitization on generation prompts | User-controlled text (nationality, interests, destination) injected directly into LLM prompts | Medium |
| In-memory rate limiter on shared endpoint | Per-process only, not distributed across Vercel instances | Low (backup to Redis limiter) |
| No request logging / audit trail | No structured logging of API requests beyond `console.error` on failures | Medium |
| No webhook/callback for async generation | SSE is fire-and-forget; no retry if client disconnects mid-stream | Medium |
| No trip/itinerary size limits | Large trips (many cities × many days) could generate oversized payloads | Low |
| Share tokens are sequential-ish | 12-char base64url tokens; no expiry or revocation mechanism | Low |
| No pagination on trip list | `GET /api/v1/trips` returns all trips; no limit/offset | Low (most users have few trips) |
| Guest trip orphaning | Guest trips (`profileId: null`) have no cleanup mechanism | Low |
| No idempotency on generation | Duplicate POST to `/generate` creates duplicate itinerary versions | Low |

### 15.3 Security Considerations

| Area | Current State | Recommendation |
|------|--------------|----------------|
| Auth | Supabase cookie sessions, middleware protection | Solid |
| Rate limiting | Upstash Redis sliding window, fail-open | Solid, consider fail-closed for generation endpoint |
| CORS | Not explicitly configured (Next.js defaults) | Review if API consumed by external clients |
| CSP | Configured in `next.config.ts` | Solid |
| SQL injection | Prisma parameterized queries | Protected |
| XSS | React auto-escaping + CSP | Protected |
| Affiliate redirect | Domain whitelist | Protected against open redirect |
| IP hashing | SHA256 (first 16 chars) in affiliate clicks | GDPR-compliant |
| Account deletion | Cascade delete + Supabase admin API | GDPR-compliant |
| Data export | Full nested export endpoint | GDPR-compliant |
| Prompt injection | User input directly in LLM prompts | Consider sanitization |

### 15.4 Performance Considerations

| Area | Current | Notes |
|------|---------|-------|
| Generation latency | ~10-30s typical | Haiku is fast; enrichment runs in parallel |
| Flight optimization | Potentially slow with many cities | Many parallel Amadeus calls; cached 2h |
| Weather cache TTL | 7 days | Reasonable for historical data |
| Amadeus token cache | Redis, ~25min TTL | Prevents repeated OAuth flows |
| DB queries | No explicit indexes beyond Prisma defaults | Monitor query performance as data grows |
| Payload size | Unbounded itinerary JSON | Consider compression for large trips |
