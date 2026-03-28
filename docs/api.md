# Fichi API Reference

Every endpoint is documented twice:

- **Developer** — technical details for engineers and AI agents
- **PM** — plain-language explanation of what it does and why it exists

**Base URL:** `/api` (all versioned endpoints under `/api/v1`)

---

## Trips

### `GET /api/v1/trips`

|               |                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                                                                        |
| **Developer** | Returns the authenticated user's trips with active itinerary metadata, destination info derived from route data, and a `isSuperUser` flag. Supports pagination. |
| **PM**        | Fetches the user's list of saved trips so they can see all their planned travels in one place.                                                                  |

### `POST /api/v1/trips`

|               |                                                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Optional (supports guests)                                                                                                                                                                                                  |
| **Developer** | Creates a new trip record. Accepts trip intent fields (region, dates, travelers, budget). If unauthenticated, sets a guest owner cookie for later claim. Also builds the initial itinerary skeleton and prefetches flights. |
| **PM**        | Creates a new trip when a user finishes the planning questionnaire. Works for guests too — they can plan without signing up, and claim the trip later if they create an account.                                            |

### `GET /api/v1/trips/[id]`

|               |                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Auth**      | Required (trip owner)                                                                                                          |
| **Developer** | Returns a single trip with its active itinerary, serialized via `tripSerializer`. 404 if not found, 403 if not owner.          |
| **PM**        | Loads a specific trip's full details — the itinerary, cities, activities, budget — everything needed to display the trip page. |

### `DELETE /api/v1/trips/[id]`

|               |                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------- |
| **Auth**      | Required (trip owner)                                                                          |
| **Developer** | Deletes a trip and all associated data (itineraries, swipes, edits, clicks). Cascading delete. |
| **PM**        | Lets a user permanently delete a trip they no longer want.                                     |

---

## Activity Discovery

### `POST /api/v1/trips/[id]/discover-activities`

|                |                                                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**       | Required (trip owner)                                                                                                                                                                                                              |
| **Rate limit** | 60s timeout                                                                                                                                                                                                                        |
| **Developer**  | Calls Claude Haiku to generate swipeable activity candidates for a specific city within the trip. Streams results via SSE. Respects `req.signal` for client-side cancellation. Resolves user profile from trip or request context. |
| **PM**         | Uses AI to suggest fun things to do in each city. The user sees activity cards they can swipe through (like/dislike) to personalize their itinerary.                                                                               |

### `POST /api/v1/trips/[id]/activity-swipes`

|               |                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required (trip owner)                                                                                                                                                                 |
| **Developer** | Records a like/dislike decision on a discovered activity. Accepts a `final` flag to mark discovery as complete for a city. Returns updated activity and discovery status.             |
| **PM**        | Saves the user's choice when they swipe right (want it) or left (skip it) on a suggested activity. Once they've reviewed all suggestions for a city, that city is marked as complete. |

### `POST /api/v1/trips/[id]/activity-images`

|               |                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------- |
| **Auth**      | Required (trip owner)                                                                             |
| **Developer** | Batch-resolves images for 1-30 activities by ID. Returns image URLs for rendering activity cards. |
| **PM**        | Loads photos for activity cards so users can see what each place looks like before deciding.      |

---

## Flights

### `POST /api/v1/trips/[id]/flights`

|               |                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Optional (supports guests)                                                                                                                                                 |
| **Developer** | On-demand flight search for a trip leg. Calls SerpApi with optional filters (non-stop, max price). Returns up to 5 options per leg. Requires trip access (owner or guest). |
| **PM**        | Searches for real flight options between cities in the trip so users can compare prices and times.                                                                         |

### `POST /api/v1/trips/[id]/optimize`

|               |                                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required (trip owner)                                                                                                                                                                          |
| **Developer** | Runs SerpApi flight price optimization across the full itinerary route. Returns a `FlightSkeleton` with per-leg pricing and a baseline total. Client is responsible for persisting the result. |
| **PM**        | Finds the best flight prices across the entire trip route and shows users how much the whole journey would cost.                                                                               |

### `GET /api/v1/flights/book`

|               |                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Optional                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Developer** | **Returns HTML, not JSON.** Resolves a flight booking token via SerpApi, logs an affiliate click (best-effort, non-blocking), and returns an auto-submitting HTML form that POSTs to the airline. This preserves browser context (cookies, session, referrer) that airlines require. Handles SerpApi rate limits with 429. See [TRA-80](https://linear.app/travel-pro/issue/TRA-80) for planned revisit. |
| **PM**        | When a user clicks "Book" on a flight, this sends them to the airline's booking page in a way that actually works (airlines are picky about how you arrive). We track the click for analytics.                                                                                                                                                                                                           |

---

## Selections (Travel Wallet)

### `GET /api/v1/selections/cart`

|               |                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                                  |
| **Developer** | Returns all unbooked selections (flights + hotels) across all trips for the authenticated user. Requires a profile.       |
| **PM**        | Shows the user's saved picks that they haven't booked yet — their "shopping cart" of flights and hotels across all trips. |

### `GET /api/v1/selections/count`

|               |                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                     |
| **Developer** | Returns a count of unbooked selections. Lightweight endpoint for badge/notification display. |
| **PM**        | Powers the notification badge that shows how many unbooked picks the user has saved.         |

### `GET/PUT/DELETE/PATCH /api/v1/trips/[id]/selections/flights`

|               |                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required (trip owner + profile)                                                                                                                                                    |
| **Developer** | CRUD for flight selections within a trip. `PUT` creates or updates a selection. `DELETE` removes it. `PATCH` marks it as booked. `GET` returns all flight selections for the trip. |
| **PM**        | Lets users save, update, remove, or mark as booked their preferred flight options for a trip. Think of it as a wishlist for flights.                                               |

### `GET/PUT/DELETE/PATCH /api/v1/trips/[id]/selections/hotels`

|               |                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required (trip owner + profile)                                                                                                                          |
| **Developer** | CRUD for hotel selections within a trip. Same structure as flight selections — `PUT` to save, `DELETE` to remove, `PATCH` to mark booked, `GET` to list. |
| **PM**        | Same as flight selections but for hotels — save, compare, and track which accommodations you want to book.                                               |

---

## Booking & Affiliate Tracking

### `GET/POST/PATCH /api/v1/trips/[id]/booking-clicks`

|               |                                                                                                                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required (trip owner)                                                                                                                                                                                                                                      |
| **Developer** | Manages booking confirmations in the trip preparation checklist. `GET` fetches existing clicks for a trip. `POST` creates a manual booking record (user booked outside the app). `PATCH` confirms or denies whether a click resulted in an actual booking. |
| **PM**        | Part of the trip preparation checklist. Users can confirm "yes, I booked this flight/hotel" or manually add bookings they made elsewhere. Helps track what's done vs. what still needs booking.                                                            |

### `GET /api/v1/affiliate/redirect`

|               |                                                                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | None (tracks guests too)                                                                                                                                                                                                   |
| **Developer** | Logs an affiliate click (provider, city, IP hash, optional metadata) to the `affiliateClick` table, then 302 redirects to the partner URL. Domain whitelist enforced. Used by `buildTrackedLink()` in frontend components. |
| **PM**        | When a user clicks a link to Skyscanner, Booking.com, or GetYourGuide, this logs the click for analytics and sends them to the partner site. Works for non-logged-in users too.                                            |

---

## Enrichment

> **Note:** These endpoints require authentication. Rate limiting is handled at the proxy layer (60 req/min).

### `POST /api/v1/enrich/weather`

|               |                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                                                                         |
| **Developer** | Enriches a trip route with weather forecasts. Uses Open-Meteo API with Redis 7-day cache. Accepts city stops with dates. Uses `createEnrichmentRoute()` factory. |
| **PM**        | Adds weather forecasts to each city in the trip so users know what to expect and can pack accordingly.                                                           |

### `POST /api/v1/enrich/visa`

|               |                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                                          |
| **Developer** | Enriches a trip with visa requirements based on user nationality and destination countries. Uses Passport Index static data.      |
| **PM**        | Checks if the user needs a visa for any of their destinations based on their passport, and shows requirements like max stay days. |

### `POST /api/v1/enrich/accommodation`

|               |                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                  |
| **Developer** | Generates accommodation recommendations using AI based on route, dates, traveler count, and travel style. |
| **PM**        | Suggests hotels and places to stay that match the user's budget and travel style for each city.           |

---

## Profile

### `GET /api/v1/profile`

|               |                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                                                                                              |
| **Developer** | Returns the authenticated user's profile (nationality, home airport, travel style, interests, vibes, onboarding status, premium/superuser flags). Serialized via `profileSerializer`. |
| **PM**        | Loads the user's travel preferences and account info for the profile/settings page.                                                                                                   |

### `PATCH /api/v1/profile`

|               |                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                  |
| **Developer** | Upserts profile fields. Accepts partial updates. Validates with Zod schema.                               |
| **PM**        | Saves changes when a user updates their travel preferences, nationality, home airport, or other settings. |

### `DELETE /api/v1/profile`

|               |                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                                              |
| **Developer** | GDPR account deletion. Deletes the profile, all associated trips, and calls Supabase admin API to remove the auth user. Irreversible. |
| **PM**        | Lets a user permanently delete their account and all their data. Required for GDPR compliance.                                        |

### `GET /api/v1/profile/export`

|               |                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                                                       |
| **Developer** | Exports all user data as a JSON download (profile, trips, itineraries, swipes, clicks). Includes timestamp. GDPR data portability requirement. |
| **PM**        | Lets a user download all their data as a file. Required for GDPR — users have the right to take their data with them.                          |

---

## Admin (Superuser Only)

These endpoints are restricted to superuser accounts (currently two people). They power internal tooling for monitoring and managing the platform.

### `GET /api/v1/admin/stats`

|               |                                                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Superuser                                                                                                                                                   |
| **Developer** | Returns aggregate platform statistics: total users, trips, itineraries, and counts by generation/discovery status. Uses `Promise.all` for parallel queries. |
| **PM**        | Dashboard numbers — how many users, trips, and itineraries exist, and how many are in each stage of generation.                                             |

### `GET /api/v1/admin/users`

|               |                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Superuser                                                                                                                                       |
| **Developer** | Paginated user list with search (by nationality, home airport, user ID). Includes trip count per user. Query params: `page`, `limit`, `search`. |
| **PM**        | Browse and search all users on the platform. See who they are and how many trips they've planned.                                               |

### `GET /api/v1/admin/trips`

|               |                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Superuser                                                                                                            |
| **Developer** | Paginated trip list with search (by destination, region, trip ID). Includes profile association and itinerary count. |
| **PM**        | Browse and search all trips on the platform. Useful for debugging user issues or understanding usage patterns.       |

### `DELETE /api/v1/admin/trips/[id]`

|               |                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------- |
| **Auth**      | Superuser                                                                                 |
| **Developer** | Admin-level trip deletion. Bypasses ownership check.                                      |
| **PM**        | Delete any trip on the platform — for cleaning up test data or handling support requests. |

---

## Infrastructure

### `GET /api/health`

|               |                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth**      | None                                                                                                                                             |
| **Developer** | Returns service health with individual component checks (Supabase, database). Returns 200 if all healthy, 207 if partial failure. Force-dynamic. |
| **PM**        | A simple "is the app working?" check. Monitoring tools ping this to alert us if something is down.                                               |

### `POST /api/v1/client-errors`

|               |                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth**      | None                                                                                                                                                                                                         |
| **Developer** | Fire-and-forget client error reporter. Validates payload with Zod, records error with user agent info, returns 202. Possible overlap with Sentry — see [TRA-85](https://linear.app/travel-pro/issue/TRA-85). |
| **PM**        | Catches errors that happen in the user's browser so we can find and fix bugs. May overlap with our existing error tracking (Sentry) — under review.                                                          |

### `GET /api/v1/places/photo`

|               |                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth**      | Required                                                                                                                                                                       |
| **Developer** | Proxies Google Places photos to keep the API key server-side. Query params: `ref` (photo reference), `w` (width). Returns image bytes with 24h client cache / 7d server cache. |
| **PM**        | Loads city and place photos throughout the app without exposing our Google API key to the browser.                                                                             |

---

## Related Linear Tickets

| Ticket                                               | Summary                                            |
| ---------------------------------------------------- | -------------------------------------------------- |
| [TRA-80](https://linear.app/travel-pro/issue/TRA-80) | Revisit `/flights/book` endpoint complexity        |
| [TRA-82](https://linear.app/travel-pro/issue/TRA-82) | Add auth + rate limiting to enrichment endpoints   |
| [TRA-83](https://linear.app/travel-pro/issue/TRA-83) | Add auth to `/places/photo` proxy                  |
| [TRA-84](https://linear.app/travel-pro/issue/TRA-84) | Remove share functionality (`/share/[token]`)      |
| [TRA-85](https://linear.app/travel-pro/issue/TRA-85) | Revisit `/client-errors` — possible Sentry overlap |
