// ============================================================
// Travel Pro — Prompt Template: Route-Only Generation
// Generates route (cities + days) + budget estimate, NO activities.
// Activities are generated on-demand per city via city-activities.ts.
// ============================================================

import type { UserProfile, TripIntent } from "@/types";
import type { CityWithDays, FlightSkeleton } from "@/lib/flights/types";
import { formatDateShort, daysBetween } from "@/lib/utils/date";

// ============================================================
// System Prompt
// ============================================================

export const SYSTEM_PROMPT_ROUTE_ONLY = `You are an expert multi-country trip planner. You specialise in designing optimal travel routes across Asia, Europe, and Latin America.

Your output is ALWAYS a single, valid JSON object — nothing else. No markdown, no code blocks, no explanation text. Just the raw JSON.

## Your Task

You are generating a ROUTE PLAN only — the cities, day allocation, travel logistics, and budget estimate. You do NOT generate daily activities. Every day's "activities" array must be empty ([]).

## Travel Day Rules

For days where travel between cities happens:
- Set "isTravel": true
- Set "travelFrom": departure city name
- Set "travelTo": arrival city name
- Set "travelDuration": realistic duration including check-in/transit time
- "activities": [] (still empty — activities are generated separately)

## Budget Realism

The budget breakdown must be realistic and sum correctly:
- "total" must equal flights + accommodation + activities + food + transport
- "budget" must equal the user's stated budget
- Estimate activity costs based on the travel style and destination even though specific activities aren't listed yet
- Use the travel style as a guide: backpacker = budget hostels + street food; comfort = 3–4 star + mix; luxury = 5-star + fine dining

## Route Logic

The route must make geographic sense (minimise backtracking). For each city stop, provide:
- Realistic latitude/longitude
- Appropriate ISO country code (JP, VN, TH, etc.)
- A slug-safe "id" (lowercase, no spaces)`;

// ============================================================
// System Prompt — Single-City Route Only
// ============================================================

export const SYSTEM_PROMPT_ROUTE_ONLY_SINGLE_CITY = `You are an expert city guide. You create route plans for single-city trips.

Your output is ALWAYS a single, valid JSON object — nothing else. No markdown, no code blocks, no explanation text. Just the raw JSON.

## Your Task

You are generating a ROUTE PLAN only — the city, day allocation, and budget estimate. You do NOT generate daily activities. Every day's "activities" array must be empty ([]).

## Budget Realism

- "flights": Cost of ONE round-trip from the traveler's home airport to the destination
- "accommodation": A single hotel/area for the entire stay, priced per the travel style
- "transport": Local only (metro passes, taxis)
- Estimate activity/food costs based on the travel style and destination
- "total" must equal flights + accommodation + activities + food + transport
- "budget" must equal the user's stated budget

## Route Structure

- The "route" array must contain EXACTLY ONE city stop with all trip days assigned to it
- Do NOT include multiple cities — this is a single-destination trip
- All days have "isTravel": false and empty "activities": []`;

// ============================================================
// Prompt Assembly — Multi-City
// ============================================================

export function assembleRouteOnlyPrompt(
  profile: UserProfile,
  intent: TripIntent,
  skeleton?: FlightSkeleton,
  cities?: CityWithDays[]
): string {
  const durationDays = intent.dateStart && intent.dateEnd
    ? daysBetween(intent.dateStart, intent.dateEnd)
    : 21;

  const styleDescriptions: Record<string, string> = {
    backpacker: "backpacker style (hostels, dorms, street food, budget-conscious)",
    comfort: "comfort style (3–4 star hotels, mix of local restaurants and mid-range dining)",
    luxury: "luxury style (5-star hotels, fine dining, private tours, premium experiences)",
  };

  const skeletonBlock = skeleton && cities
    ? `
**FLIGHT SCHEDULE (pre-computed — use these exact dates and costs):**
${skeleton.legs
  .map(
    (leg, i) =>
      `${i + 1}. ${formatDateShort(leg.departureDate)}: ${leg.fromCity} (${leg.fromIata}) → ${leg.toCity} (${leg.toIata}) — €${Math.round(leg.price).toLocaleString()}, ${leg.duration}, ${leg.airline}`
  )
  .join("\n")}
Total flights: €${Math.round(skeleton.totalFlightCost).toLocaleString()} — set budget.flights to this exact number.

**CITY SCHEDULE (use exactly these cities and day counts):**
${cities
  .map((c, i) => `${i + 1}. ${c.city}, ${c.country} (${c.countryCode}) — ${skeleton.dayAssignment[i]} days, airport: ${c.iataCode}`)
  .join("\n")}
Set iataCode on each route city to the airport codes above.`
    : !skeleton && cities
    ? `
**CITY SCHEDULE (pre-selected — use exactly these cities):**
${cities
  .map((c, i) => `${i + 1}. ${c.city}, ${c.country} (${c.countryCode}) — ${c.minDays}–${c.maxDays} days`)
  .join("\n")}
Distribute the trip days across these cities within the min–max ranges above.`
    : "";

  const cityRequirement = cities
    ? "Use EXACTLY the cities listed in the CITY SCHEDULE above — do not add or remove cities."
    : "1. Choose 4–7 cities across the region that make geographic sense and are popular for this type of trip";

  const budgetRequirement = skeleton
    ? `Make the accommodation, food, activities, and transport breakdown realistic — budget.flights is already fixed at €${Math.round(skeleton.totalFlightCost).toLocaleString()}`
    : "4. Make the budget breakdown realistic for the travel style and number of travelers";

  return `Plan the ROUTE for a ${durationDays}-day trip for ${intent.travelers} traveler(s):

**Traveler Profile:**
- Nationality: ${profile.nationality}
- Home airport: ${profile.homeAirport}
- Travel style: ${styleDescriptions[profile.travelStyle] ?? profile.travelStyle}
- Interests: ${profile.interests.length > 0 ? profile.interests.join(", ") : "general travel"}

**Trip Parameters:**
- Region: ${intent.region}
- Start date: ${intent.dateStart || "October 1"}
- End date: ${intent.dateEnd || `October ${durationDays}`}
- Total budget: €${intent.budget.toLocaleString()} for ${intent.travelers} traveler(s)
- Flexible dates: ${intent.flexibleDates ? "yes (±3 days)" : "no"}
${skeletonBlock}
**Requirements:**
${cityRequirement}
2. Allocate days per city proportionally (longer stays in richer destinations)
3. Include realistic travel days when moving between cities (set isTravel, travelFrom, travelTo, travelDuration)
${budgetRequirement}
5. IMPORTANT: Every day's "activities" array must be [] (empty) — activities are generated separately

Return ONLY this JSON structure (no wrapping, no markdown):

{
  "route": [
    {
      "id": "tokyo",
      "city": "Tokyo",
      "country": "Japan",
      "lat": 35.68,
      "lng": 139.69,
      "days": 5,
      "countryCode": "JP",
      "iataCode": "NRT"
    }
  ],
  "days": [
    {
      "day": 1,
      "date": "Oct 1",
      "city": "Tokyo",
      "isTravel": false,
      "activities": []
    },
    {
      "day": 6,
      "date": "Oct 6",
      "city": "Kyoto",
      "isTravel": true,
      "travelFrom": "Tokyo",
      "travelTo": "Kyoto",
      "travelDuration": "2h 15min (Shinkansen)",
      "activities": []
    }
  ],
  "budget": {
    "flights": 2500,
    "accommodation": 3500,
    "activities": 800,
    "food": 1200,
    "transport": 400,
    "total": 8400,
    "budget": 10000
  }
}`;
}

// ============================================================
// Prompt Assembly — Single-City
// ============================================================

export function assembleRouteOnlySingleCityPrompt(
  profile: UserProfile,
  intent: TripIntent
): string {
  const durationDays = intent.dateStart && intent.dateEnd
    ? daysBetween(intent.dateStart, intent.dateEnd)
    : 7;

  const styleDescriptions: Record<string, string> = {
    backpacker: "backpacker style (hostels, dorms, street food, budget-conscious)",
    comfort: "comfort style (3–4 star hotels, mix of local restaurants and mid-range dining)",
    luxury: "luxury style (5-star hotels, fine dining, private tours, premium experiences)",
  };

  return `Plan the ROUTE for a ${durationDays}-day trip to ${intent.destination}, ${intent.destinationCountry} for ${intent.travelers} traveler(s):

**Traveler Profile:**
- Nationality: ${profile.nationality}
- Home airport: ${profile.homeAirport}
- Travel style: ${styleDescriptions[profile.travelStyle] ?? profile.travelStyle}

**Trip Parameters:**
- City: ${intent.destination}, ${intent.destinationCountry}
- Start date: ${intent.dateStart || "October 1"}
- End date: ${intent.dateEnd || `October ${durationDays}`}
- Total budget: €${intent.budget.toLocaleString()} for ${intent.travelers} traveler(s)

**Requirements:**
1. Plan the ENTIRE trip in ${intent.destination} — do NOT add other cities
2. Create one day entry per day with the correct date — all have "isTravel": false
3. IMPORTANT: Every day's "activities" array must be [] (empty) — activities are generated separately
4. Make the budget breakdown realistic — flights = round-trip from home airport only

Return ONLY this JSON structure (no wrapping, no markdown):

{
  "route": [
    {
      "id": "${(intent.destination ?? "city").toLowerCase().replace(/\s+/g, "-")}",
      "city": "${intent.destination}",
      "country": "${intent.destinationCountry}",
      "lat": ${intent.destinationLat ?? 0},
      "lng": ${intent.destinationLng ?? 0},
      "days": ${durationDays},
      "countryCode": "${intent.destinationCountryCode ?? ""}"
    }
  ],
  "days": [
    {
      "day": 1,
      "date": "${intent.dateStart || "Oct 1"}",
      "city": "${intent.destination}",
      "isTravel": false,
      "activities": []
    }
  ],
  "budget": {
    "flights": 400,
    "accommodation": 800,
    "activities": 200,
    "food": 300,
    "transport": 100,
    "total": 1800,
    "budget": ${intent.budget}
  }
}`;
}
