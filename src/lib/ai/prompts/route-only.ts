// ============================================================
// Travel Pro — Prompt Template: Route-Only Generation
// Generates route (cities + days), NO activities.
// Activities are generated on-demand per city via city-activities.ts.
// ============================================================

import type { UserProfile, TripIntent } from "@/types";
import type { CityWithDays, FlightSkeleton } from "@/lib/flights/types";
import { formatDateShort, daysBetween } from "@/lib/utils/format/date";

// ============================================================
// System Prompt
// ============================================================

export const SYSTEM_PROMPT_ROUTE_ONLY = `You are an expert multi-country trip planner. You specialise in designing optimal travel routes across Asia, Europe, and Latin America.

Your output is ALWAYS a single, valid JSON object — nothing else. No markdown, no code blocks, no explanation text. Just the raw JSON.

## Your Task

You are generating a ROUTE PLAN only — the cities, day allocation, and travel logistics. You do NOT generate daily activities. Every day's "activities" array must be empty ([]).

## Travel Day Rules

For days where travel between cities happens:
- Set "isTravel": true
- Set "travelFrom": departure city name
- Set "travelTo": arrival city name
- Set "travelDuration": realistic duration including check-in/transit time
- "activities": [] (still empty — activities are generated separately)

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

You are generating a ROUTE PLAN only — the city and day allocation. You do NOT generate daily activities. Every day's "activities" array must be empty ([]).

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
  const durationDays =
    intent.dateStart && intent.dateEnd ? daysBetween(intent.dateStart, intent.dateEnd) : 21;

  const styleDescriptions: Record<string, string> = {
    backpacker: "backpacker style (hostels, dorms, street food, budget-conscious)",
    "smart-budget":
      "smart budget style (mid-range hotels, value-focused restaurants, efficient transport)",
    "comfort-explorer":
      "comfort explorer style (boutique hotels, stronger dining scene, curated experiences)",
    luxury: "luxury style (5-star hotels, fine dining, private tours, premium experiences)",
  };

  const skeletonBlock =
    skeleton && cities
      ? `
**FLIGHT SCHEDULE (pre-computed — use these exact dates and costs):**
${skeleton.legs
  .map(
    (leg, i) =>
      `${i + 1}. ${formatDateShort(leg.departureDate)}: ${leg.fromCity} (${leg.fromIata}) → ${leg.toCity} (${leg.toIata}) — €${Math.round(leg.price).toLocaleString()}, ${leg.duration}, ${leg.airline}`
  )
  .join("\n")}
Total flight cost: €${Math.round(skeleton.totalFlightCost).toLocaleString()}

**CITY SCHEDULE (use exactly these cities and day counts):**
${cities
  .map(
    (c, i) =>
      `${i + 1}. ${c.city}, ${c.country} (${c.countryCode}) — ${skeleton.dayAssignment[i]} days, airport: ${c.iataCode}`
  )
  .join("\n")}
Set iataCode on each route city to the airport codes above.`
      : !skeleton && cities
        ? `
**CITY SCHEDULE (pre-selected — use exactly these cities):**
${cities
  .map(
    (c, i) =>
      `${i + 1}. ${c.city}, ${c.country} (${c.countryCode}) — ${c.minDays}–${c.maxDays} days`
  )
  .join("\n")}
Distribute the trip days across these cities within the min–max ranges above.`
        : "";

  const cityRequirement = cities
    ? "Use EXACTLY the cities listed in the CITY SCHEDULE above — do not add or remove cities."
    : "1. Choose 4–7 cities across the region that make geographic sense and are popular for this type of trip";

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
${skeletonBlock}${intent.description?.trim() ? `\n**Special Requests from the traveler:**\n${intent.description.trim()}\n` : ""}
**Requirements:**
${cityRequirement}
2. Allocate days per city proportionally (longer stays in richer destinations)
3. Include realistic travel days when moving between cities (set isTravel, travelFrom, travelTo, travelDuration)
4. IMPORTANT: Every day's "activities" array must be [] (empty) — activities are generated separately

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
  ]
}`;
}

// ============================================================
// Prompt Assembly — Single-City
// ============================================================

export function assembleRouteOnlySingleCityPrompt(
  profile: UserProfile,
  intent: TripIntent
): string {
  const durationDays =
    intent.dateStart && intent.dateEnd ? daysBetween(intent.dateStart, intent.dateEnd) : 7;

  const styleDescriptions: Record<string, string> = {
    backpacker: "backpacker style (hostels, dorms, street food, budget-conscious)",
    "smart-budget":
      "smart budget style (mid-range hotels, value-focused restaurants, efficient transport)",
    "comfort-explorer":
      "comfort explorer style (boutique hotels, stronger dining scene, curated experiences)",
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
${intent.description?.trim() ? `\n**Special Requests from the traveler:**\n${intent.description.trim()}\n` : ""}
**Requirements:**
1. Plan the ENTIRE trip in ${intent.destination} — do NOT add other cities
2. Create one day entry per day with the correct date — all have "isTravel": false
3. IMPORTANT: Every day's "activities" array must be [] (empty) — activities are generated separately

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
  ]
}`;
}
