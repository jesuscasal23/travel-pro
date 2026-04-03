# Fichi API Reference

Every endpoint is documented twice:

- **Developer**: implementation-oriented summary
- **PM**: plain-language product purpose

**Base URL:** `/api` with versioned endpoints under `/api/v1`

> Rate limits are enforced centrally in `src/proxy.ts`. The main buckets are: discovery `5/hour`, flight search and booking resolution `20/min`, enrichment and places/image helpers `60/min`, general API reads `120/min`, and general API mutations `30/min`.

## Trips

### `GET /api/v1/trips`

|               |                                                                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                                                                                                             |
| **Developer** | Returns the authenticated profile's trips plus active-itinerary metadata, derived destination fallback fields, and an `isSuperUser` flag. If the user has no profile row yet, returns an empty list. |
| **PM**        | Loads the signed-in user's saved trips for the trips list and home surfaces.                                                                                                                         |

### `POST /api/v1/trips`

|               |                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Optional                                                                                                                                                                  |
| **Developer** | Creates a trip from validated planner input, links it to the user's profile when one exists, and sets a guest-owner cookie when it does not. Returns the serialized trip. |
| **PM**        | Creates a new trip record from planner input and attaches it to the current user when possible.                                                                           |

### `GET /api/v1/trips/[id]`

|               |                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Trip owner access                                                                                                          |
| **Developer** | Loads one trip with its active itinerary set. Access is enforced through profile ownership or the guest-owner cookie path. |
| **PM**        | Fetches the full data needed to render a specific trip workspace.                                                          |

### `DELETE /api/v1/trips/[id]`

|               |                                                                            |
| ------------- | -------------------------------------------------------------------------- |
| **Auth**      | Trip owner access                                                          |
| **Developer** | Deletes a trip through the trip collection service after ownership checks. |
| **PM**        | Permanently removes one trip and its dependent records.                    |

## Activity Discovery

### `POST /api/v1/trips/[id]/discover-activities`

|                |                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**       | Trip owner access                                                                                                                                                                  |
| **Rate limit** | `5/hour` per IP, `maxDuration = 60`                                                                                                                                                |
| **Developer**  | Validates discovery input, resolves the effective traveler profile, calls Claude-backed activity discovery, and returns activity cards plus round-limit and reachability metadata. |
| **PM**         | Generates swipeable activity suggestions for one city in the trip.                                                                                                                 |

### `POST /api/v1/trips/[id]/activity-swipes`

|               |                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Trip owner access                                                                                                                                                                        |
| **Developer** | Records a like or dislike on a discovered activity and returns city and trip completion progress. When all cities are complete, the server assigns liked activities into itinerary days. |
| **PM**        | Saves the user's activity choices and advances the discovery flow.                                                                                                                       |

### `POST /api/v1/trips/[id]/activity-images`

|                |                                                                 |
| -------------- | --------------------------------------------------------------- |
| **Auth**       | Trip owner access                                               |
| **Rate limit** | `60/min` per IP                                                 |
| **Developer**  | Resolves image URLs for batches of discovered activities by ID. |
| **PM**         | Loads photos for discovery cards and activity surfaces.         |

## Flights

### `POST /api/v1/trips/[id]/flights`

|                |                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| **Auth**       | Trip access                                                                                          |
| **Rate limit** | `20/min` per IP                                                                                      |
| **Developer**  | Runs an on-demand flight search for a trip leg with validated filters and current trip access rules. |
| **PM**         | Finds flight options between cities in the trip.                                                     |

### `POST /api/v1/trips/[id]/optimize`

|               |                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------- |
| **Auth**      | Trip owner access                                                                                 |
| **Developer** | Runs route-wide flight price optimization and returns a priced flight skeleton for the itinerary. |
| **PM**        | Estimates the best overall flight plan for the whole trip.                                        |

### `GET /api/v1/flights/book`

|                |                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**       | Optional                                                                                                                                                                            |
| **Rate limit** | `20/min` per IP                                                                                                                                                                     |
| **Developer**  | Resolves a booking token into an airline or OTA handoff, logs the affiliate click best-effort, validates the destination URL, and returns an HTML auto-submit form instead of JSON. |
| **PM**         | Sends the user from a saved flight option to the actual booking destination.                                                                                                        |

## Selections & Booking

### `GET /api/v1/selections/cart`

|               |                                                                                         |
| ------------- | --------------------------------------------------------------------------------------- |
| **Auth**      | Required profile                                                                        |
| **Developer** | Returns grouped flight and hotel selections for the authenticated profile across trips. |
| **PM**        | Powers the cart or wallet page that aggregates saved bookings.                          |

### `GET /api/v1/selections/count`

|               |                                                                     |
| ------------- | ------------------------------------------------------------------- |
| **Auth**      | Required profile                                                    |
| **Developer** | Returns the unbooked selection count for the authenticated profile. |
| **PM**        | Drives lightweight "items left to book" indicators.                 |

### `GET /api/v1/trips/[id]/selections/flights`

|               |                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------- |
| **Auth**      | Required profile + trip owner                                                             |
| **Developer** | Returns all saved flight selections for a trip after auth, profile, and ownership checks. |
| **PM**        | Loads the flights the user has saved for one trip.                                        |

### `PUT /api/v1/trips/[id]/selections/flights`

|               |                                                                            |
| ------------- | -------------------------------------------------------------------------- |
| **Auth**      | Required profile + trip owner                                              |
| **Developer** | Validates and upserts one saved flight selection for the trip and profile. |
| **PM**        | Saves or updates the flight option the user wants to keep.                 |

### `DELETE /api/v1/trips/[id]/selections/flights`

|               |                                                               |
| ------------- | ------------------------------------------------------------- |
| **Auth**      | Required profile + trip owner                                 |
| **Developer** | Removes one saved flight selection by validated selection ID. |
| **PM**        | Deletes a saved flight option from the trip.                  |

### `PATCH /api/v1/trips/[id]/selections/flights`

|               |                                                            |
| ------------- | ---------------------------------------------------------- |
| **Auth**      | Required profile + trip owner                              |
| **Developer** | Marks a saved flight selection booked or unbooked.         |
| **PM**        | Lets the user mark whether a saved flight has been booked. |

### `GET /api/v1/trips/[id]/selections/hotels`

|               |                                                   |
| ------------- | ------------------------------------------------- |
| **Auth**      | Required profile + trip owner                     |
| **Developer** | Returns all saved hotel selections for a trip.    |
| **PM**        | Loads the hotels the user has saved for one trip. |

### `PUT /api/v1/trips/[id]/selections/hotels`

|               |                                                                     |
| ------------- | ------------------------------------------------------------------- |
| **Auth**      | Required profile + trip owner                                       |
| **Developer** | Validates and upserts one hotel selection for the trip and profile. |
| **PM**        | Saves or updates the hotel option the user wants to keep.           |

### `DELETE /api/v1/trips/[id]/selections/hotels`

|               |                                                              |
| ------------- | ------------------------------------------------------------ |
| **Auth**      | Required profile + trip owner                                |
| **Developer** | Removes one saved hotel selection by validated selection ID. |
| **PM**        | Deletes a saved hotel option from the trip.                  |

### `PATCH /api/v1/trips/[id]/selections/hotels`

|               |                                                           |
| ------------- | --------------------------------------------------------- |
| **Auth**      | Required profile + trip owner                             |
| **Developer** | Marks a saved hotel selection booked or unbooked.         |
| **PM**        | Lets the user mark whether a saved hotel has been booked. |

### `GET /api/v1/trips/[id]/booking-clicks`

|               |                                                                             |
| ------------- | --------------------------------------------------------------------------- |
| **Auth**      | Required trip owner                                                         |
| **Developer** | Returns booking-click records for one trip after auth and ownership checks. |
| **PM**        | Loads tracked booking interactions for a specific trip.                     |

### `POST /api/v1/trips/[id]/booking-clicks`

|               |                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| **Auth**      | Required trip owner                                                                                    |
| **Developer** | Creates a manual booking record for a `flight` or `hotel` click type, with optional city and metadata. |
| **PM**        | Lets the user record a booking that happened outside the tracked affiliate flow.                       |

### `PATCH /api/v1/trips/[id]/booking-clicks`

|               |                                                                             |
| ------------- | --------------------------------------------------------------------------- |
| **Auth**      | Required trip owner                                                         |
| **Developer** | Confirms or unconfirms an existing booking-click row using validated input. |
| **PM**        | Lets the user say whether a booking handoff turned into a real booking.     |

### `GET /api/v1/affiliate/redirect`

|               |                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| **Auth**      | None                                                                                                     |
| **Developer** | Validates the outbound destination, logs the affiliate click, and returns a redirect to the partner URL. |
| **PM**        | Tracks outbound booking clicks before sending the user to a partner site.                                |

## Enrichment

> All enrichment routes are created through `createEnrichmentRoute(...)`, require auth, and use the shared auxiliary `60/min` rate-limit bucket.

### `POST /api/v1/enrich/weather`

|               |                                                                                 |
| ------------- | ------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                        |
| **Developer** | Enriches a route with weather data through the shared enrichment route factory. |
| **PM**        | Adds weather context to each stop in the trip.                                  |

### `POST /api/v1/enrich/visa`

|               |                                                                                         |
| ------------- | --------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                |
| **Developer** | Enriches a route with visa requirements based on traveler nationality and destinations. |
| **PM**        | Shows whether the traveler needs a visa for each destination.                           |

### `POST /api/v1/enrich/health`

|               |                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                       |
| **Developer** | Returns destination-level health and vaccination guidance from the health enrichment pipeline. |
| **PM**        | Shows health-entry and vaccination guidance for the trip.                                      |

### `POST /api/v1/enrich/accommodation`

|               |                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                    |
| **Developer** | Builds accommodation recommendations for each city using the accommodation enrichment flow. |
| **PM**        | Suggests places to stay that match the route and traveler preferences.                      |

## Profile

### `GET /api/v1/profile`

|               |                                                                            |
| ------------- | -------------------------------------------------------------------------- |
| **Auth**      | Required                                                                   |
| **Developer** | Loads the authenticated user's profile and serializes it for frontend use. |
| **PM**        | Fetches the user's saved travel preferences and account-level flags.       |

### `PATCH /api/v1/profile`

|               |                                                                  |
| ------------- | ---------------------------------------------------------------- |
| **Auth**      | Required                                                         |
| **Developer** | Validates a profile patch and upserts the stored profile record. |
| **PM**        | Saves profile changes from the planner or profile page.          |

### `DELETE /api/v1/profile`

|               |                                                                     |
| ------------- | ------------------------------------------------------------------- |
| **Auth**      | Required                                                            |
| **Developer** | Deletes the user's profile and account through the profile service. |
| **PM**        | Permanently removes the user's account and saved data.              |

### `GET /api/v1/profile/export`

|               |                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                            |
| **Developer** | Exports the authenticated user's profile data bundle and returns it with an `exportedAt` timestamp. |
| **PM**        | Lets the user download their stored data.                                                           |

## Feedback

### `GET /api/v1/feedback`

|               |                                                          |
| ------------- | -------------------------------------------------------- |
| **Auth**      | Required                                                 |
| **Developer** | Returns feedback submissions for the authenticated user. |
| **PM**        | Loads the signed-in user's feedback history.             |

### `POST /api/v1/feedback`

|               |                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Required                                                                                                                            |
| **Developer** | Validates a feedback submission, enriches it with user metadata and request user-agent, and stores it through the feedback service. |
| **PM**        | Creates a new feedback ticket from the product UI.                                                                                  |

### `GET /api/v1/feedback/[id]`

|               |                                                                   |
| ------------- | ----------------------------------------------------------------- |
| **Auth**      | Required                                                          |
| **Developer** | Returns one feedback submission scoped to the authenticated user. |
| **PM**        | Loads the detail view for one feedback item.                      |

## Stripe (Payments)

### `POST /api/v1/stripe/checkout`

|               |                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------ |
| **Auth**      | Required                                                                                   |
| **Developer** | Creates a Stripe Checkout Session for the selected paid plan and returns the redirect URL. |
| **PM**        | Starts the premium checkout flow.                                                          |

### `POST /api/v1/stripe/portal`

|               |                                                                         |
| ------------- | ----------------------------------------------------------------------- |
| **Auth**      | Required                                                                |
| **Developer** | Creates a Stripe billing portal session for the authenticated customer. |
| **PM**        | Opens self-serve subscription management.                               |

### `POST /api/v1/stripe/webhook`

|               |                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | None, Stripe signature required                                                                                           |
| **Developer** | Verifies the Stripe signature on the raw request body, hands the event to the Stripe service, and returns a JSON receipt. |
| **PM**        | Keeps premium billing state in sync after Stripe events.                                                                  |

## Admin (Superuser Only)

### `GET /api/v1/admin/stats`

|               |                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Superuser                                                                                                           |
| **Developer** | Returns aggregate counts for users, trips, itineraries, recent signups, recent trips, and itinerary build statuses. |
| **PM**        | Powers the admin overview dashboard.                                                                                |

### `GET /api/v1/admin/users`

|               |                                                                                     |
| ------------- | ----------------------------------------------------------------------------------- |
| **Auth**      | Superuser                                                                           |
| **Developer** | Returns a paginated, searchable user list with trip counts and core profile fields. |
| **PM**        | Lets staff browse and search users.                                                 |

### `GET /api/v1/admin/trips`

|               |                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------- |
| **Auth**      | Superuser                                                                                     |
| **Developer** | Returns a paginated, searchable trip list with itinerary counts and profile linkage metadata. |
| **PM**        | Lets staff browse and search trips.                                                           |

### `DELETE /api/v1/admin/trips/[id]`

|               |                                                 |
| ------------- | ----------------------------------------------- |
| **Auth**      | Superuser                                       |
| **Developer** | Deletes any trip as an admin action.            |
| **PM**        | Lets staff remove trips for support or cleanup. |

### `GET /api/v1/admin/feedback`

|               |                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Superuser                                                                                                     |
| **Developer** | Returns the admin feedback queue through the feedback service, including URL-driven filtering and pagination. |
| **PM**        | Lets staff review incoming user feedback.                                                                     |

### `PATCH /api/v1/admin/feedback/[id]`

|               |                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | Superuser                                                                                                              |
| **Developer** | Validates a feedback status update, records the acting profile, and publishes the update through the feedback service. |
| **PM**        | Lets staff change the visible status or note on a feedback item.                                                       |

## Infrastructure

### `GET /api/health`

|               |                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------- |
| **Auth**      | None                                                                                                |
| **Developer** | Returns `healthy` plus component checks, with HTTP `200` for healthy and `207` for partial failure. |
| **PM**        | Simple health endpoint for monitoring and diagnostics.                                              |

### `GET /api/v1/places/cities`

|               |                                                                     |
| ------------- | ------------------------------------------------------------------- |
| **Auth**      | None                                                                |
| **Developer** | Returns the supported city catalog from the cities feature service. |
| **PM**        | Loads searchable destination options for the planner.               |

### `GET /api/v1/places/photo`

|                |                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Auth**       | Required                                                                                                                  |
| **Rate limit** | `60/min` per IP                                                                                                           |
| **Developer**  | Proxies Google Places photo bytes so the browser never receives the API key. Accepts `ref` and optional `w` query params. |
| **PM**         | Loads place photos securely inside the app.                                                                               |

## Related Linear Tickets

| Ticket                                               | Summary                                          |
| ---------------------------------------------------- | ------------------------------------------------ |
| [TRA-82](https://linear.app/travel-pro/issue/TRA-82) | Add auth + rate limiting to enrichment endpoints |
| [TRA-83](https://linear.app/travel-pro/issue/TRA-83) | Add auth to `/places/photo` proxy                |
| [TRA-84](https://linear.app/travel-pro/issue/TRA-84) | Remove share functionality (`/share/[token]`)    |
