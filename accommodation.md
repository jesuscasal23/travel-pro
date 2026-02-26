# Accommodation Feature Analysis — Travel Pro

> Written: February 2026
> Purpose: Evaluate whether adding accommodation recommendations is worth building, how much revenue it could generate, and how complex the implementation would be.

---

## 1. Current State of the App

Travel Pro already handles accommodation in two implicit ways:

1. **Budget allocation** — `budget.accommodation` is a line item in the generated `TripBudget` (e.g. €3,500 of a €10,000 trip). The AI estimates this figure based on travel style and city count, but recommends no specific hotels.
2. **Affiliate link builder** — `buildHotelLink()` already exists in `src/lib/affiliate/link-generator.ts` and generates a Booking.com deep-link with city, check-in/out dates, and traveler count. It is **not yet surfaced anywhere in the UI**.

In short: the plumbing is partially there, but no accommodation value is delivered to the user today.

---

## 2. The Case For It

### Why it's a natural fit

The app already solves three of the five steps of travel planning:

| Step                  | Covered?                               |
| --------------------- | -------------------------------------- |
| Where to go           | ✅ Route selection (Claude Haiku)      |
| When to go / how long | ✅ Date optimisation, day distribution |
| How to get there      | ✅ Real flights via Amadeus API        |
| **Where to stay**     | ❌ Not covered                         |
| What to do            | ✅ Day-by-day activities               |

Accommodation is the **single biggest gap** in the user journey. After a user sees their itinerary, their immediate next question is "where do I actually sleep?" Without an answer the user leaves to search on Booking.com themselves — and Travel Pro loses the conversion.

### User experience argument

- The app generates city-by-city stays with exact dates already (from the flight skeleton).
- The app knows the user's travel style (backpacker / comfort / luxury) and their budget.
- It therefore has all the inputs needed to present curated hotel suggestions — not generic search results.

Adding accommodation recommendations turns the app from an **itinerary generator** into a **full trip planner**, a materially stronger product for sales and retention.

---

## 3. Revenue Potential — Affiliate Commissions

### The commission structure

**Booking.com** is the most realistic primary partner given `buildHotelLink()` already targets it.

| Channel                              | Effective commission on booking value                 |
| ------------------------------------ | ----------------------------------------------------- |
| Direct Booking.com affiliate program | ~3.75–6% (25–40% of Booking.com's ~15% hotel fee)     |
| Via Travelpayouts                    | **5% of total booking price** (simplest, recommended) |
| Via Awin / CJ network                | ~4%                                                   |

Booking.com currently **does not use cross-session cookie tracking** via the direct program — the user must complete the booking in the same session as the click. Via networks (Awin, CJ, Travelpayouts) a **30-day cookie** is available, which significantly improves attribution.

**Recommendation: join via Travelpayouts for 5% + 30-day cookie tracking.**

### Earnings model per itinerary

Using the sample trip as a baseline (22 days, 2 travelers, comfort style, 7 cities):

| Variable                                      | Value    |
| --------------------------------------------- | -------- |
| Total accommodation budget                    | €3,500   |
| Average nightly rate (comfort, 2 pax, 1 room) | ~€120    |
| Approximate nights                            | ~20      |
| Commission rate                               | 5%       |
| Commission if all nights booked via app       | **€175** |

That is the theoretical ceiling. In practice, not every user books every hotel through an affiliate link. Applying realistic funnel metrics:

| Stage                                       | Rate      | Notes                                         |
| ------------------------------------------- | --------- | --------------------------------------------- |
| Users who see hotel recommendations         | 100%      | Surface in trip view                          |
| Click-through to Booking.com                | 20–35%    | Well-placed, contextual CTA                   |
| Complete booking in session (30-day cookie) | 35–50%    | Intent is high — they already chose this city |
| Overall funnel (clicks × bookings)          | **7–17%** | Per itinerary                                 |

| Scenario                                                  | Expected value per generated itinerary |
| --------------------------------------------------------- | -------------------------------------- |
| Conservative (7% conversion, 2 hotels booked, €120/night) | ~€8                                    |
| Mid (12% conversion, 3 hotels booked, €120/night)         | ~€22                                   |
| Optimistic (17% conversion, full trip booked)             | ~€30                                   |

At 1,000 itineraries/month, mid-case = **~€22,000/month** from accommodation alone — comparable to or exceeding flight affiliate revenue from Skyscanner (lower ticket prices, shorter booking sessions).

### Comparison to other hotel programs

| Program                     | Commission                   | Cookie  | Notes                                    |
| --------------------------- | ---------------------------- | ------- | ---------------------------------------- |
| Booking.com (Travelpayouts) | 5%                           | 30 days | Best brand recognition, global inventory |
| Hotels.com (Expedia Group)  | up to 6%                     | 7 days  | Good US/Asia inventory                   |
| Expedia                     | 2–6%                         | 7 days  | Unified with Hotels.com since 2023       |
| TripAdvisor                 | 50% of TripAdvisor's cut     | Session | Good for comparison widget               |
| Airbnb                      | ❌ Program closed March 2021 | —       | Not available                            |

**Booking.com is the clear winner** for this app's audience (international multi-city trips in Asia/Europe) due to global hotel inventory, brand trust, and competitive commission on mid/luxury hotels which is where comfort/luxury users spend.

### Activity affiliate context (for comparison)

GetYourGuide already in-place:

- Pays **8% commission** on activities booked
- Activities budget: €800 for sample trip → ceiling ~€64 per trip
- Hotels ceiling: €175 per trip — **2.7× higher** than activities

This makes accommodation the **highest-value affiliate category** in the stack, above both flights (thin margins, complex attribution) and activities.

---

## 4. Implementation Complexity

### What already exists (no work needed)

- `buildHotelLink(city, arrivalDate, departureDate, travelers)` — fully implemented in `src/lib/affiliate/link-generator.ts`
- `AffiliateClick` Prisma model with `clickType: "hotel"` already in schema
- `buildTrackedLink()` for click attribution — works with hotel links
- `budget.accommodation` in `TripBudget` — accommodation cost already modelled
- `CityStop` has `arrivalDate`/`departureDate` implicit from flight skeleton (`itinerary.flightLegs`)

### What needs to be built

#### Tier 1 — Minimal viable (1–2 days)

**Wire up existing affiliate link in UI**

- Add a "Find hotels" button per city on the trip view and summary page
- Call existing `buildHotelLink()` + `buildTrackedLink()`
- No AI changes, no type changes

This delivers affiliate revenue with almost no risk. The UI shows a contextual CTA like "3 nights in Tokyo · ~€120/night → Search on Booking.com".

Effort: **~4–6 hours**

---

#### Tier 2 — Curated recommendations (3–5 days)

**AI-generated hotel suggestions per city**

Add `AccommodationRecommendation[]` to the `Itinerary` type:

```ts
interface AccommodationRecommendation {
  city: string; // matches CityStop.city
  type: "hostel" | "guesthouse" | "boutique" | "hotel" | "resort";
  name: string; // e.g. "Park Hyatt Tokyo"
  pricePerNightEur: number;
  nights: number; // derived from CityStop.days
  totalEur: number;
  why: string; // 1-sentence recommendation reason
  neighbourhood: string; // e.g. "Shinjuku, walking distance to metro"
  bookingLink: string; // generated via buildHotelLink()
}
```

**Changes required:**

1. **`src/types/index.ts`** — add `AccommodationRecommendation` interface, extend `Itinerary` with `accommodation?: AccommodationRecommendation[]`
2. **`src/lib/ai/prompts/v1.ts`** — update system prompt to output hotel suggestions per city (name, type, nightly rate, neighbourhood). Instruct Claude to match travel style (backpacker → hostels, comfort → 3–4 star, luxury → 5 star)
3. **`src/lib/ai/pipeline.ts`** — parse and validate hotel recommendations from AI output, post-process to attach `buildHotelLink()` URLs
4. **`src/app/trip/[id]/page.tsx`** — add accommodation section to the right-column timeline (collapsible card per city, showing hotel name, nights, price, booking CTA)
5. **`src/app/trip/[id]/summary/page.tsx`** — add Accommodation tab alongside Route/Budget/Visa/Weather

Effort: **~3–5 days**

---

#### Tier 3 — Live hotel search (2–4 weeks)

**Real-time availability + prices via Booking.com Content API or RapidAPI hotel search**

- Replace AI hotel names with live search results
- Show actual availability, real prices, photos
- Filter by user's budget and travel style automatically
- Add hotel comparison within each city

This is a significant engineering effort requiring:

- API integration (Booking.com requires a partnership agreement for their API; RapidAPI alternatives are available)
- Caching layer (Redis) for search results
- New UI components (hotel cards with images, ratings, price comparison)
- Error handling for unavailability

Effort: **~2–4 weeks** — Only worth building if Tier 1 + Tier 2 show strong conversion.

---

### Complexity summary table

| Tier | Description                          | Effort    | Revenue impact | Risk     |
| ---- | ------------------------------------ | --------- | -------------- | -------- |
| 1    | Wire up existing hotel link buttons  | 4–6 hours | Low–Medium     | Very low |
| 2    | AI-curated hotel names + booking CTA | 3–5 days  | Medium–High    | Low      |
| 3    | Live hotel search API                | 2–4 weeks | High (ceiling) | Medium   |

---

## 5. Recommendation

**Build Tier 1 immediately, plan Tier 2 for next sprint.**

Tier 1 is the lowest-effort, lowest-risk way to start earning accommodation commissions. The function is already written — it just needs to appear in the UI. This should take a few hours and could start generating revenue for every trip viewed.

Tier 2 turns the app into a genuine accommodation planner. The AI already writes destination descriptions and understands travel style — adding hotel naming is a small prompt extension. The expected value per itinerary (€22 at mid-case) makes this among the highest-ROI features on the roadmap.

Tier 3 should be validated by data: if click-through on Tier 2 hotel names is high but conversion is low (because users want to verify the specific hotel), then live search is justified. Don't build it speculatively.

### One-line verdict

> The infrastructure is 40% built, the revenue ceiling is higher than any other affiliate category in the app, and the incremental complexity is low. **Accommodation recommendations should be a priority feature.**

---

## Sources

- [Booking.com Affiliate Program — Commission & Program Details (2026)](https://getlasso.co/affiliate/booking/)
- [Booking.com Affiliate Support Centre — Commission and Payments](https://affiliates.support.booking.com/kb/s/article/Commission-and-Payments)
- [Travelpayouts — Booking.com Affiliate Program](https://www.travelpayouts.com/en/offers/bookingcom-affiliate-program/)
- [How Much Does Booking.com Pay Affiliates in 2025? — Reacheffect](https://reacheffect.com/blog/how-much-does-booking-com-pay-affiliates/)
- [Best Travel Affiliate Programs (2025) — wecantrack](https://wecantrack.com/insights/best-travel-affiliate-programs/)
- [46 of the Best Travel Affiliate Programs for 2026 — Tapfiliate](https://tapfiliate.com/blog/travel-affiliate-programs/)
- [Booking.com Affiliate Program — In-Depth Review — creator-hero.com](https://www.creator-hero.com/blog/booking-com-affiliate-program-in-depth-review-pros-and-cons)
- [Best High-Ticket Travel Affiliate Programs — Travelpayouts](https://www.travelpayouts.com/blog/high-paying-travel-affiliate-programs/)
- [Airbnb Affiliate Program Alternatives — Travelpayouts](https://www.travelpayouts.com/blog/airbnb-affiliate-program-associates-alternatives/)
