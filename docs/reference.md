# Fichi — Reference Docs

## Project Structure

```
src/
├── app/
│   ├── (marketing)/           # Landing + privacy (public, Navbar wrapper)
│   ├── (auth)/                # signup, login, forgot-password, reset-password
│   ├── (app)/                 # Mobile-first app shell (430px container layout)
│   │   ├── get-started/       # Onboarding entry
│   │   ├── home/              # Dashboard
│   │   ├── trips/             # Trip list + detail sub-pages: [id]/(budget|flights|hotels|itinerary|map)
│   │   ├── bookings/          # Travel wallet (mock)
│   │   ├── premium/           # Premium subscription page
│   │   └── profile/           # Settings hub
│   ├── dashboard/             # Redirect → /home
│   ├── plan/                  # Multi-step questionnaire
│   ├── trip/[id]/             # 40/60 map+timeline, edit, summary
│   ├── auth/callback/         # Supabase OAuth callback
│   └── api/
│       ├── health/
│       └── v1/
├── components/
│   ├── ui/                    # Button, Card, Badge, Tabs, Modal, Toast, Combobox, AlertBox, ProgressBar, BottomNav
│   ├── auth/                  # Auth form styles + ServerErrorAlert
│   ├── map/                   # RouteMap (MapLibre, dynamic import) + fallback
│   ├── export/                # PDFDownloadButton
│   └── trip/                  # BudgetBreakdown, TripNotFound, plan-view/
├── lib/
│   ├── ai/                    # enrich-visa, enrich-weather; prompts/city-activities
│   ├── api/                   # helpers (auth guards, apiHandler), errors
│   ├── core/                  # prisma, logger, request-context, abort
│   ├── features/
│   │   ├── trips/             # itinerary-service, trip-query-service, discover-activities-service, activity-swipe-service, etc.
│   │   ├── profile/           # profile-service, schemas, query-shapes
│   │   ├── enrichment/        # schemas, transforms
│   │   ├── affiliate/         # redirect-service, link-generator, booking-click-service
│   │   └── health/
│   ├── forms/                 # Form validation schemas
│   ├── flights/               # serpapi.ts, optimizer.ts, booking-links, iata
│   ├── hotels/                # SerpApi hotel search + types
│   ├── itinerary/             # Shared Zod schemas (cityGeoSchema, itinerarySchema)
│   ├── client/                # apiFetch, SSE parser, error reporting
│   └── utils/                 # date, error, country-flags, trip-metadata, etc.
├── stores/useTripStore.ts
├── types/index.ts
├── data/                      # cities, nationalities, airports-full, visa-index, travelStyles
├── hooks/                     # api/ (React Query hooks by feature), useCityImage, useInstallPrompt
└── proxy.ts                   # Auth + rate limiting
```

## API Routes

| Route                                    | Methods            | Auth        | Notes                                     |
| ---------------------------------------- | ------------------ | ----------- | ----------------------------------------- |
| `/api/health`                            | GET                | None        | Env check                                 |
| `/api/v1/trips`                          | GET, POST          | Auth        | List/create trips                         |
| `/api/v1/trips/[id]`                     | GET, PATCH, DELETE | Trip access | PATCH creates new itinerary version       |
| `/api/v1/trips/[id]/optimize`            | POST               | Trip access | SerpApi flight price optimization         |
| `/api/v1/trips/[id]/discover-activities` | POST               | Trip access | Claude Haiku activity discovery (max 60s) |
| `/api/v1/trips/[id]/activity-swipes`     | POST               | Trip access | Record like/dislike swipe                 |
| `/api/v1/trips/[id]/flights`             | POST               | Trip access | Search flights for a leg                  |
| `/api/v1/trips/[id]/booking-clicks`      | GET, POST, PATCH   | Auth + trip | Track/confirm booking clicks              |
| `/api/v1/flights/book`                   | GET                | Optional    | Auto-submit booking form redirect         |
| `/api/v1/enrich/weather`                 | POST               | Auth        | Open-Meteo + Redis 7d cache               |
| `/api/v1/enrich/visa`                    | POST               | Auth        | Visa requirement enrichment               |
| `/api/v1/enrich/accommodation`           | POST               | Auth        | Hotel enrichment                          |
| `/api/v1/profile`                        | GET, PATCH, DELETE | Auth        | Upsert profile, GDPR delete               |
| `/api/v1/profile/export`                 | GET                | Auth        | GDPR data export                          |
| `/api/v1/affiliate/redirect`             | GET                | Optional    | Log click + 302 redirect                  |
| `/api/v1/places/photo`                   | GET                | Auth        | Proxy Google Places photos                |
| `/api/v1/stripe/checkout`                | POST               | Auth        | Create Stripe Checkout session            |
| `/api/v1/stripe/webhook`                 | POST               | None        | Stripe webhook (signature verified)       |
| `/api/v1/stripe/portal`                  | POST               | Auth        | Stripe Customer Portal URL                |
| `/api/v1/admin/stats`                    | GET                | SuperUser   | Platform statistics                       |
| `/api/v1/admin/users`                    | GET                | SuperUser   | List all users                            |
| `/api/v1/admin/trips`                    | GET                | SuperUser   | List all trips                            |
| `/api/v1/admin/trips/[id]`               | DELETE             | SuperUser   | Delete trip                               |

## Database Models (7 in `prisma/schema.prisma`)

- **Profile**: userId (unique), nationality, homeAirport, travelStyle, interests[], vibes? (Json), activityLevel?, languagesSpoken[], onboardingCompleted, isPremium, stripeCustomerId?, stripeSubscriptionId?, stripePriceId?, stripeCurrentPeriodEnd?, isSuperUser
- **Trip**: profileId?, tripType, region, destination?, destinationCountry?, destinationCountryCode?, dateStart, dateEnd, travelers, description?
- **Itinerary**: tripId, data (Json), version, isActive, promptVersion, generationStatus (pending|generating|complete|failed), discoveryStatus (pending|in_progress|completed), generationJobId?
- **ActivitySwipe**: tripId, profileId?, activityName, destination, decision (liked|disliked), activityData (Json)
- **ItineraryEdit**: itineraryId?, editType (adjust_days|remove_city|reorder_cities|add_city|regenerate_activities), editPayload (Json), description?
- **AffiliateClick**: tripId?, provider (skyscanner|booking|getyourguide), clickType (flight|hotel|activity), city?, destination?, url, userId?, sessionId?, ipHash?, metadata? (Json), bookingConfirmed?
- **DiscoveredCity**: city, country, countryCode, lat, lng, timesProposed, firstTripId?, approved — unique on (city, countryCode)

## Proxy Rate Limits (`src/proxy.ts`)

- `/api/v1/trips/*/discover-activities`: 5 req/hour
- `/api/v1/trips/*/flights`: 20 req/min
- `/api/v1/trips/*/activity-images`, `/api/v1/enrich/*`, `/api/v1/places/*`: 60 req/min
- `/api/v1/*` general: 30 req/min
- Fail-open if Redis unavailable

## Required Env Vars

```
ANTHROPIC_API_KEY
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_SENTRY_DSN
SERPAPI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_LIFETIME
STRIPE_PRICE_YEARLY
STRIPE_PRICE_MONTHLY
```

See `.env.local.example` for full list.

## CSP / Security Headers (`next.config.ts`)

- `script-src unsafe-inline` (+ `unsafe-eval` in dev) + PostHog CDN
- `worker-src blob:` required by MapLibre GL Web Workers
- Add new external domains to `connect-src` before using new APIs
