# Travel Pro — Local Development Setup

## Prerequisites

- Node.js 18+
- Docker Desktop (running)
- npm

## Quick Start

### 1. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432`. Verify it's running:

```bash
docker compose ps
```

You should see `travelpro-db` with status "healthy".

### 2. Push the database schema

```bash
npx prisma db push
```

This creates the `profiles`, `trips`, and `itineraries` tables in the local PostgreSQL.

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## What works without API keys

The app uses **sample data** for all display pages, so most of the UI works immediately:

| Feature | Works without keys? | Notes |
|---------|-------------------|-------|
| Landing page | Yes | Static content |
| Onboarding flow | Yes | Saves to localStorage via Zustand |
| Plan questionnaire | Yes | All 6 cards + animations |
| Generation loading screen | Yes | Timed animation sequence |
| Itinerary view (timeline) | Yes | Uses `sampleData.ts` |
| Itinerary view (map) | **SVG fallback** | Needs `NEXT_PUBLIC_MAPBOX_TOKEN` for real Mapbox |
| Edit mode | Yes | Local state only |
| Summary page | Yes | Uses sample data |
| Dashboard | Yes | Uses sample trips |
| PDF download | Yes | Client-side generation |
| AI generation (real) | **No** | Needs `ANTHROPIC_API_KEY` |
| Database storage | **Local Docker** | Already configured in `.env.local` |
| Weather caching | **Skipped** | Works without Redis — calls Open-Meteo directly |

---

## Adding API Keys

Edit `.env.local` to enable additional features:

### Mapbox (free — 50,000 loads/month)

1. Create account at [mapbox.com](https://account.mapbox.com)
2. Copy your default public token
3. Set `NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here`
4. Restart dev server

### Anthropic (pay-per-use — ~$0.09/generation)

1. Get your API key at [console.anthropic.com](https://console.anthropic.com/settings/keys)
2. Set `ANTHROPIC_API_KEY=sk-ant-your_key_here`
3. Restart dev server
4. The "Generate My Itinerary" button on `/plan` will now call Claude

### Upstash Redis (optional — free tier)

1. Create account at [upstash.com](https://console.upstash.com)
2. Create a Redis database (region: eu-central-1)
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
4. Weather API responses will now be cached for 7 days

---

## Testing the Full Flow

Walk through each screen in order:

1. **/** — Landing page. Click "Start Planning".
2. **/onboarding** — Step 1: nationality + airport. Step 2: travel style + interests. Click "Get Started".
3. **/plan** — 6 question cards. Fill in region, dates, budget, vibe, travelers. Click "Generate My Itinerary".
4. **Loading screen** — 6 animated steps (runs on a timer, navigates automatically).
5. **/trip/japan-vietnam-thailand-2026** — Map + timeline view. Click map pins, click day cards, expand sidebar tabs.
6. **/trip/japan-vietnam-thailand-2026/edit** — Expand cities, adjust day counts, remove cities.
7. **/trip/japan-vietnam-thailand-2026/summary** — Review tables, click "Share Link", click "Download PDF".
8. **/dashboard** — See saved trips, click "Plan a New Trip".

---

## Useful Commands

```bash
# Start Docker services
docker compose up -d

# Stop Docker services
docker compose down

# Reset database (delete all data)
docker compose down -v

# Push schema changes to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Type check
npx tsc --noEmit

# Production build
npm run build

# Run dev server
npm run dev
```

---

## Troubleshooting

**Port 5432 already in use:**
Stop any existing PostgreSQL, or change the port in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"
```
Then update `DATABASE_URL` in `.env.local` to use port 5433.

**Prisma db push fails:**
Make sure Docker is running and the container is healthy:
```bash
docker compose ps
docker compose logs postgres
```

**Map shows SVG instead of Mapbox:**
Set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local` and restart the dev server.

**AI generation returns error:**
Set `ANTHROPIC_API_KEY` in `.env.local`. Check the terminal for pipeline logs (`[pipeline] ...`).
