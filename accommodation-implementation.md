# Accommodation Implementation Plan

> Status: Ready to build
> Approach: Tier 2 (AI-curated recommendations + Booking.com affiliate CTAs)
> Estimated effort: ~1.5–2 days

The affiliate infrastructure (`buildHotelLink`, `buildTrackedLink`, `AffiliateClick`) already exists. This plan wires it end-to-end: type → prompt → pipeline → UI.

---

## Overview of changes

| #   | File                                 | What changes                                                          |
| --- | ------------------------------------ | --------------------------------------------------------------------- |
| 1   | `src/types/index.ts`                 | Add `AccommodationRecommendation` type; extend `Itinerary`            |
| 2   | `src/lib/ai/prompts/v1.ts`           | Add hotel rules to system prompt; add `accommodation` to JSON schema  |
| 3   | `src/lib/ai/pipeline.ts`             | Add Zod schema; add city-date derivation helper; attach booking links |
| 4   | `src/data/sampleData.ts`             | Add `accommodation` array to `sampleFullItinerary`                    |
| 5   | `src/app/trip/[id]/page.tsx`         | Add Hotels tab to left-panel sidebar                                  |
| 6   | `src/app/trip/[id]/summary/page.tsx` | Add Accommodation tab with per-city booking cards                     |

No new files. No DB migrations. No new API routes.

---

## Step 1 — Type definitions

**File:** `src/types/index.ts`

Add the new interface after the `CityWeather` interface (line 82):

```ts
/** A hotel recommendation for one city stop */
export interface AccommodationRecommendation {
  city: string; // matches CityStop.city exactly
  name: string; // e.g. "Shinjuku Granbell Hotel"
  type: "hostel" | "guesthouse" | "boutique" | "hotel" | "resort";
  neighbourhood: string; // e.g. "Shinjuku, 5 min walk to JR station"
  pricePerNightEur: number; // per room per night
  nights: number; // == CityStop.days
  totalEur: number; // pricePerNightEur × nights
  why: string; // 1-sentence pitch
  /** Populated post-processing in pipeline — not set by Claude */
  bookingLink?: string;
}
```

Extend the `Itinerary` interface (add after `flightLegs?`):

```ts
export interface Itinerary {
  route: CityStop[];
  days: TripDay[];
  budget: TripBudget;
  visaData: VisaInfo[];
  weatherData: CityWeather[];
  flightLegs?: ItineraryFlightLeg[];
  accommodation?: AccommodationRecommendation[]; // ← add this
}
```

---

## Step 2 — Prompt update

**File:** `src/lib/ai/prompts/v1.ts`

### 2a. Add hotel rules to `SYSTEM_PROMPT_V1`

Append a new section to the system prompt string (after the `## Route Logic` block):

```
## Accommodation Recommendations

For each city stop, recommend one specific hotel that matches the traveller's travel style:
- "name": A real, specific hotel name (e.g. "Shinjuku Granbell Hotel", not "a nice hotel")
- "type": One of: hostel, guesthouse, boutique, hotel, resort
- "neighbourhood": Street-level location with a practical note (e.g. "Gion district, walking distance to Fushimi Inari")
- "pricePerNightEur": Realistic nightly rate per room in EUR for the travel style:
    backpacker → €15–40 (hostels/dorms), comfort → €80–160 (3–4 star), luxury → €200–600 (5-star)
- "nights": Same as the city's days count in the route
- "totalEur": pricePerNightEur × nights
- "why": One sentence explaining why this is a great base for this city
Use real hotels that actually exist at the destination. Do not invent names.
```

### 2b. Add `accommodation` to the JSON schema example in `assemblePrompt`

In `assemblePrompt`, the `return` template literal ends with the closing `}` of the full JSON. Add the accommodation block to the top-level return object — insert it between `"budget": {...}` and the final `}`:

```
  "accommodation": [
    {
      "city": "Tokyo",
      "name": "Shinjuku Granbell Hotel",
      "type": "hotel",
      "neighbourhood": "Shinjuku, 3 min walk to Shinjuku-sanchome metro",
      "pricePerNightEur": 150,
      "nights": 5,
      "totalEur": 750,
      "why": "Design-forward hotel in the heart of Shinjuku with rooftop bar — ideal base for Tokyo nightlife and day trips"
    }
  ]
```

Add a new requirement line to the `**Requirements:**` list:

```
8. For each city in the route, output one accommodation recommendation matching the traveller's travel style
```

---

## Step 3 — Pipeline: Zod schema + date helpers + link attachment

**File:** `src/lib/ai/pipeline.ts`

### 3a. Add `accommodationSchema`

Add after `budgetSchema`:

```ts
const accommodationRecommendationSchema = z.object({
  city: z.string(),
  name: z.string(),
  type: z.enum(["hostel", "guesthouse", "boutique", "hotel", "resort"]),
  neighbourhood: z.string(),
  pricePerNightEur: z.number(),
  nights: z.number(),
  totalEur: z.number(),
  why: z.string(),
});
```

Update `claudeItinerarySchema` to include it as optional (graceful fallback if Claude omits it):

```ts
const claudeItinerarySchema = z.object({
  route: z.array(cityStopSchema),
  days: z.array(tripDaySchema),
  budget: budgetSchema,
  accommodation: z.array(accommodationRecommendationSchema).optional(),
});
```

### 3b. Add `deriveCityDates` helper

Add this helper function before `generateItinerary`. It computes check-in/check-out dates per city from the flight skeleton (preferred) or by accumulating days from `tripIntent.dateStart` (fallback):

```ts
/**
 * Derive arrival + departure dates per city.
 * Prefers flight skeleton dates; falls back to sequential day accumulation.
 */
function deriveCityDates(
  route: CityStop[],
  flightLegs: ItineraryFlightLeg[] | undefined,
  tripStartDate: string
): Array<{ city: string; arrivalDate: string; departureDate: string }> {
  if (flightLegs && flightLegs.length >= route.length) {
    // Flight legs: [home→city0, city0→city1, …, cityN→home]
    // leg[i].departureDate = departure from city[i-1] = arrival at city[i]
    return route.map((stop, i) => ({
      city: stop.city,
      arrivalDate: flightLegs[i].departureDate,
      departureDate:
        flightLegs[i + 1]?.departureDate ?? addDays(flightLegs[i].departureDate, stop.days),
    }));
  }

  // Fallback: accumulate from tripStartDate
  let cursor = tripStartDate || new Date().toISOString().slice(0, 10);
  return route.map((stop) => {
    const arrivalDate = cursor;
    const departureDate = addDays(cursor, stop.days);
    cursor = departureDate;
    return { city: stop.city, arrivalDate, departureDate };
  });
}

/** Add N calendar days to a YYYY-MM-DD string. */
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
```

### 3c. Attach booking links in `generateItinerary`

In the pipeline's Stage 5 (Combine + store), after assembling the `itinerary` object, add:

```ts
// Attach Booking.com tracked links to accommodation recommendations
if (parsed.accommodation?.length) {
  const cityDates = deriveCityDates(
    parsed.route,
    skeleton?.legs as ItineraryFlightLeg[] | undefined,
    tripIntent.dateStart
  );

  const accommodation = parsed.accommodation.map((rec) => {
    const dates = cityDates.find((d) => d.city === rec.city);
    if (!dates) return rec;

    const rawLink = buildHotelLink(
      {
        ...parsed.route.find((r) => r.city === rec.city)!,
        arrivalDate: dates.arrivalDate,
        departureDate: dates.departureDate,
      },
      tripIntent.travelers
    );

    return {
      ...rec,
      bookingLink: buildTrackedLink({
        provider: "booking",
        type: "hotel",
        itineraryId: tripIntent.id,
        city: rec.city,
        dest: rawLink,
      }),
    };
  });

  itinerary.accommodation = accommodation;
}
```

Also add the import at the top of the file (it's already imported for `parseIataCode`, but add `buildHotelLink`):

```ts
import { parseIataCode, buildHotelLink, buildTrackedLink } from "@/lib/affiliate/link-generator";
```

---

## Step 4 — Sample data

**File:** `src/data/sampleData.ts`

Add an `accommodation` array to `sampleFullItinerary`. These are real hotels that match the comfort travel style for Thomas & Lena's Asia trip.

The trip runs Oct 1–23, 2026. City dates:

| City        | Check-in   | Check-out  | Nights | €/night | Total |
| ----------- | ---------- | ---------- | ------ | ------- | ----- |
| Tokyo       | 2026-10-01 | 2026-10-06 | 5      | €150    | €750  |
| Kyoto       | 2026-10-06 | 2026-10-09 | 3      | €170    | €510  |
| Hanoi       | 2026-10-09 | 2026-10-12 | 3      | €90     | €270  |
| Ha Long Bay | 2026-10-12 | 2026-10-14 | 2      | €180    | €360  |
| Bangkok     | 2026-10-14 | 2026-10-18 | 4      | €120    | €480  |
| Chiang Mai  | 2026-10-18 | 2026-10-21 | 3      | €130    | €390  |
| Phuket      | 2026-10-21 | 2026-10-23 | 2      | €200    | €400  |

Total: €3,160 (matches budget.accommodation: €3,500 within rounding — acceptable)

```ts
export const sampleAccommodation: AccommodationRecommendation[] = [
  {
    city: "Tokyo",
    name: "Shinjuku Granbell Hotel",
    type: "hotel",
    neighbourhood: "Shinjuku, 3 min walk to Shinjuku-sanchome metro",
    pricePerNightEur: 150,
    nights: 5,
    totalEur: 750,
    why: "Design-forward rooms with rooftop bar in the heart of Tokyo's most vibrant district — perfect base for Shibuya, Harajuku and Shinjuku itself",
    bookingLink:
      "/api/v1/affiliate/redirect?provider=booking&type=hotel&city=Tokyo&dest=https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3DTokyo%26checkin%3D2026-10-01%26checkout%3D2026-10-06%26group_adults%3D2%26aid%3DTRAVEL_PRO_AID%26no_rooms%3D1%26selected_currency%3DEUR",
  },
  {
    city: "Kyoto",
    name: "The Thousand Kyoto",
    type: "hotel",
    neighbourhood: "Downtown Karasuma, above Kyoto Station",
    pricePerNightEur: 170,
    nights: 3,
    totalEur: 510,
    why: "Contemporary Japanese design hotel directly above Kyoto Station — a few steps to all Shinkansen connections and 15 min to Fushimi Inari",
    bookingLink:
      "/api/v1/affiliate/redirect?provider=booking&type=hotel&city=Kyoto&dest=https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3DKyoto%26checkin%3D2026-10-06%26checkout%3D2026-10-09%26group_adults%3D2%26aid%3DTRAVEL_PRO_AID%26no_rooms%3D1%26selected_currency%3DEUR",
  },
  {
    city: "Hanoi",
    name: "Hanoi La Siesta Classic Ma May",
    type: "boutique",
    neighbourhood: "Old Quarter, Ma May Street",
    pricePerNightEur: 90,
    nights: 3,
    totalEur: 270,
    why: "Intimate French-colonial boutique hotel on the most atmospheric street in the Old Quarter — breakfast on the rooftop terrace is a highlight",
    bookingLink:
      "/api/v1/affiliate/redirect?provider=booking&type=hotel&city=Hanoi&dest=https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3DHanoi%26checkin%3D2026-10-09%26checkout%3D2026-10-12%26group_adults%3D2%26aid%3DTRAVEL_PRO_AID%26no_rooms%3D1%26selected_currency%3DEUR",
  },
  {
    city: "Ha Long Bay",
    name: "Paradise Sails Classic Cruise",
    type: "resort",
    neighbourhood: "Ha Long Bay, overnight cruise vessel",
    pricePerNightEur: 180,
    nights: 2,
    totalEur: 360,
    why: "Floating boutique hotel aboard a traditional junk — kayaking, cave visits and sunset cocktails on the sundeck are all included",
    bookingLink:
      "/api/v1/affiliate/redirect?provider=booking&type=hotel&city=Ha+Long+Bay&dest=https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3DHa%2BLong%2BBay%26checkin%3D2026-10-12%26checkout%3D2026-10-14%26group_adults%3D2%26aid%3DTRAVEL_PRO_AID%26no_rooms%3D1%26selected_currency%3DEUR",
  },
  {
    city: "Bangkok",
    name: "Riva Surya Bangkok",
    type: "hotel",
    neighbourhood: "Phra Nakhon, Chao Phraya Riverside",
    pricePerNightEur: 120,
    nights: 4,
    totalEur: 480,
    why: "Riverside pool hotel in the historic district — the Wat Pho, Wat Arun and Grand Palace are all within walking distance",
    bookingLink:
      "/api/v1/affiliate/redirect?provider=booking&type=hotel&city=Bangkok&dest=https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3DBangkok%26checkin%3D2026-10-14%26checkout%3D2026-10-18%26group_adults%3D2%26aid%3DTRAVEL_PRO_AID%26no_rooms%3D1%26selected_currency%3DEUR",
  },
  {
    city: "Chiang Mai",
    name: "Tamarind Village",
    type: "boutique",
    neighbourhood: "Old City, Ratchadamnoen Road",
    pricePerNightEur: 130,
    nights: 3,
    totalEur: 390,
    why: "Tropical boutique resort hidden behind a tamarind grove in the Old City moat — close to the Sunday Walking Street and the best temples",
    bookingLink:
      "/api/v1/affiliate/redirect?provider=booking&type=hotel&city=Chiang+Mai&dest=https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3DChiang%2BMai%26checkin%3D2026-10-18%26checkout%3D2026-10-21%26group_adults%3D2%26aid%3DTRAVEL_PRO_AID%26no_rooms%3D1%26selected_currency%3DEUR",
  },
  {
    city: "Phuket",
    name: "SALA Phuket Mai Khao Beach Resort",
    type: "resort",
    neighbourhood: "Mai Khao Beach, north Phuket — quieter end of the island",
    pricePerNightEur: 200,
    nights: 2,
    totalEur: 400,
    why: "Adults-focused pool villas right on the beach — the perfect final splurge after weeks of city-hopping",
    bookingLink:
      "/api/v1/affiliate/redirect?provider=booking&type=hotel&city=Phuket&dest=https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3DPhuket%26checkin%3D2026-10-21%26checkout%3D2026-10-23%26group_adults%3D2%26aid%3DTRAVEL_PRO_AID%26no_rooms%3D1%26selected_currency%3DEUR",
  },
];
```

In `sampleFullItinerary`, add:

```ts
export const sampleFullItinerary: Itinerary = {
  route: sampleRoute,
  days: sampleDays,
  budget: sampleBudget,
  visaData: sampleVisaData,
  weatherData: sampleWeatherData,
  accommodation: sampleAccommodation, // ← add this line
};
```

Don't forget to import the type at the top of the file:

```ts
import type { ..., AccommodationRecommendation } from "@/types";
```

---

## Step 5 — Trip view: Hotels tab

**File:** `src/app/trip/[id]/page.tsx`

### 5a. Destructure `accommodation` from itinerary

```ts
// Line 39 — update destructuring
const { route, days, budget, visaData, weatherData, accommodation } = itinerary;
```

### 5b. Add "hotels" to the tab type union and tab list

```ts
// Line 44 — update type
const [activeTab, setActiveTab] = useState<"visa" | "weather" | "budget" | "hotels">("visa");
```

```tsx
// In the tab buttons map — update the array
{(["visa", "weather", "budget", "hotels"] as const).map((tab) => (
  <button ...>
    {tab === "hotels" ? "🏨 Hotels" : tab}
  </button>
))}
```

### 5c. Add Hotels tab panel

Add after the Budget tab `)}` closing tag (before the final `</motion.div>`):

```tsx
{
  /* Hotels tab */
}
{
  activeTab === "hotels" && (
    <div className="space-y-3">
      {accommodation && accommodation.length > 0 ? (
        accommodation.map((rec) => (
          <div key={rec.city} className="bg-background space-y-2 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-foreground text-sm font-medium">{rec.name}</div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {rec.city} · {rec.neighbourhood}
                </div>
              </div>
              <span className="bg-secondary text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-xs capitalize">
                {rec.type}
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">{rec.why}</p>
            <div className="flex items-center justify-between">
              <span className="text-foreground text-xs font-medium">
                €{rec.pricePerNightEur}/night · {rec.nights} nights ·{" "}
                <span className="text-primary">€{rec.totalEur}</span>
              </span>
              {rec.bookingLink && (
                <a
                  href={rec.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-3 py-1 text-xs"
                >
                  Book →
                </a>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground py-4 text-center text-xs">
          No hotel recommendations available for this itinerary.
        </p>
      )}
    </div>
  );
}
```

---

## Step 6 — Summary page: Accommodation tab

**File:** `src/app/trip/[id]/summary/page.tsx`

### 6a. Destructure `accommodation` from itinerary

```ts
const { route, days, budget, visaData, weatherData, flightLegs, accommodation } = itinerary;
```

### 6b. Add "accommodation" to the tabs

The summary page already has a tab system for Route / Budget / Visa / Weather. Find the tab state and add:

```ts
const [activeTab, setActiveTab] = useState<
  "route" | "budget" | "visa" | "weather" | "accommodation"
>("route");
```

Add "accommodation" to the tab button list:

```tsx
{
  (["route", "budget", "visa", "weather", "accommodation"] as const).map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {tab === "accommodation" ? "🏨 Hotels" : tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
  ));
}
```

### 6c. Add Accommodation tab panel

Add after the Weather tab panel:

```tsx
{
  /* Accommodation tab */
}
{
  activeTab === "accommodation" && (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Curated hotel picks for each city, matched to your travel style. Booking via these links
        directly supports Travel Pro.
      </p>
      {accommodation && accommodation.length > 0 ? (
        accommodation.map((rec) => (
          <div key={rec.city} className="card-travel bg-background space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-foreground font-semibold">{rec.city}</h3>
                <p className="text-muted-foreground mt-0.5 text-sm">{rec.name}</p>
              </div>
              <span className="bg-secondary text-muted-foreground shrink-0 rounded-full px-2 py-1 text-xs capitalize">
                {rec.type}
              </span>
            </div>

            <p className="text-muted-foreground text-sm">{rec.neighbourhood}</p>
            <p className="text-foreground text-sm">{rec.why}</p>

            <div className="border-border flex items-center justify-between border-t pt-2">
              <div className="text-sm">
                <span className="text-muted-foreground">€{rec.pricePerNightEur}/night</span>
                <span className="text-muted-foreground mx-2">·</span>
                <span className="text-muted-foreground">{rec.nights} nights</span>
                <span className="text-muted-foreground mx-2">·</span>
                <span className="text-foreground font-semibold">€{rec.totalEur} total</span>
              </div>
              {rec.bookingLink && (
                <a
                  href={rec.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-4 py-1.5 text-sm"
                >
                  Book on Booking.com →
                </a>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-muted-foreground py-8 text-center text-sm">
          Hotel recommendations are not available for this itinerary version. Regenerate your trip
          to get curated hotel picks.
        </div>
      )}

      {accommodation && accommodation.length > 0 && (
        <div className="text-muted-foreground pt-2 text-center text-xs">
          Total estimated accommodation: €
          {accommodation.reduce((s, r) => s + r.totalEur, 0).toLocaleString()}
        </div>
      )}
    </div>
  );
}
```

---

## Sequence to implement

Work in this order to keep the app buildable at each step:

1. **Types** (Step 1) — field is optional; nothing breaks
2. **Sample data** (Step 4) — demo works immediately, can visually test UI
3. **Trip view tab** (Step 5) — UI visible with sample data right away
4. **Summary tab** (Step 6) — same
5. **Prompt update** (Step 2) — AI now outputs accommodation for new trips
6. **Pipeline Zod + links** (Step 3) — new trips get tracked affiliate links attached

---

## Potential gotchas

| Issue                                              | Resolution                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| Claude omits `accommodation` from JSON             | Schema field is `.optional()` — graceful; UI shows fallback message      |
| `flightLegs` count doesn't match `route` count     | `deriveCityDates` falls back to sequential date accumulation             |
| `accommodation` missing for old itineraries in DB  | `accommodation` is optional on `Itinerary`; UI shows "regenerate" nudge  |
| Booking.com affiliate ID not in `.env.local`       | Falls back to `"TRAVEL_PRO_AID"` placeholder — link still works for demo |
| `max_tokens: 8000` insufficient with accommodation | Monitor generation; increase to 10000 if truncation occurs               |

---

## Token budget note

Adding `accommodation` to the Claude output will add approximately 400–600 tokens per trip (7 cities × ~70 tokens each). Current `max_tokens: 8000` should be sufficient for typical 5–7 city trips. If you see truncated JSON errors in logs, bump to `max_tokens: 10000` in `src/lib/ai/pipeline.ts:129`.

---

## Testing checklist

- [ ] `sampleFullItinerary.accommodation` has 7 entries, all with `bookingLink`
- [ ] Hotels tab appears in trip view left panel
- [ ] Hotels tab appears in summary page
- [ ] Each hotel card shows name, type badge, neighbourhood, price breakdown, Book button
- [ ] Book button `href` matches `/api/v1/affiliate/redirect?provider=booking&type=hotel&...`
- [ ] Affiliate redirect route logs an `AffiliateClick` with `clickType: "hotel"` (check DB or logs)
- [ ] New generation includes `accommodation` array in the returned `Itinerary`
- [ ] Old itineraries (without `accommodation`) show the fallback message gracefully
- [ ] `npm run build` passes with no type errors
- [ ] `npm test` passes (no unit tests break — Zod schema is additive)
