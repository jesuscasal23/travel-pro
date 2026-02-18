# "Add a City" Feature — Analysis & Proposal

## Current State

The edit page (`src/app/trip/[id]/edit/page.tsx`) lets users customize an AI-generated itinerary. Three edit operations are fully functional:

- **Reorder cities** — drag-and-drop via @dnd-kit
- **Adjust days** — +/- buttons per city
- **Remove a city** — X button per city

A fourth operation — **Add a city** — has a styled button (line 313) but no `onClick` handler. It's purely visual.

## Why It Exists

The edit page is designed to let users tweak the AI's output. The AI might generate a 7-city route through Asia, but a user might want to add a stop the AI didn't suggest (e.g. "I want to visit Osaka too"). The button was scaffolded during Phase 1 but never implemented.

## Why It's Not Trivial

A `CityStop` (the data structure for each city in the route) requires:

```ts
{
  id: string          // unique identifier
  city: string        // "Osaka"
  country: string     // "Japan"
  lat: number         // 34.6937
  lng: number         // 135.5023
  days: number        // 3
  countryCode: string // "JP"
}
```

The `lat`, `lng`, and `countryCode` fields are the challenge. Without correct coordinates:
- The **map marker** won't render in the right place (RouteMap uses `lat`/`lng` for markers and route lines)
- The **visa data** lookup uses `countryCode` to check entry requirements
- The **weather data** enrichment uses `lat`/`lng` for historical weather queries

So just accepting a city name string isn't enough — we need geocoding.

## The `detectEditType` Gap

The existing `detectEditType` function (lines 149-188) compares the edited cities against the original route. It detects removals, reorders, and day changes — but has no logic for detecting **added** cities. The API's `EditItinerarySchema` already accepts `"add_city"` as a valid `editType`, so the backend is ready, but the frontend detection logic would need to be extended too.

## Proposed Solution

### Option A: Geocoding via Open-Meteo (no new API keys)

The app already uses Open-Meteo for weather data. Open-Meteo has a free geocoding API:

```
GET https://geocoding-api.open-meteo.com/v1/search?name=Osaka&count=5
```

Returns: `{ results: [{ name, country, country_code, latitude, longitude, ... }] }`

**Implementation:**
1. "Add a city" button opens a small inline form with a single search input
2. As the user types, debounced calls to the Open-Meteo geocoding API return city suggestions (name + country + coordinates)
3. User picks a suggestion from a dropdown, chooses days (default 2), and confirms
4. A complete `CityStop` is created with real `lat`/`lng`/`countryCode` and appended to the `cities` array
5. Extend `detectEditType` to detect new cities (IDs not in the original route) and return `editType: "add_city"`
6. The save flow already handles sending the full updated route + itinerary data to the API

**Pros:**
- No new API keys or dependencies needed (Open-Meteo is already in `connect-src` CSP and used by enrichment)
- Accurate coordinates — map, visa, and weather all work correctly
- Free, no rate limit concerns at our scale

**Cons:**
- Adds an external API call in the browser (but it's the same service we already depend on)
- Need to handle the case where a city isn't found

### Option B: Static city database

Bundle a static JSON file of ~40,000 major cities with coordinates (e.g. from GeoNames). Use client-side fuzzy search.

**Pros:** No external API call, works offline
**Cons:** Adds ~1-2MB to the bundle, data goes stale, more complex search logic

### Option C: Disable with "Coming soon"

Replace the button with a disabled state and tooltip.

**Pros:** Honest, zero risk
**Cons:** Feature stays broken, edit page feels incomplete

## Recommendation

**Option A** (Open-Meteo geocoding). It's the cleanest solution — we already trust and use this service, it requires no new API keys, coordinates are accurate, and the implementation is straightforward. The UI would be a search input with an autocomplete dropdown, consistent with the existing `AirportCombobox` pattern used in onboarding/profile.

Estimated scope: ~80 lines of new code in the edit page + a small `geocodeCity()` utility function.
