// ============================================================
// Travel Pro — Prompt Template v1
// Quality bar: match sampleItinerary depth (src/data/sampleData.ts)
// Every activity must include: name, category, icon, why, duration
// Strongly desired: tip, food, cost
// ============================================================

import type { UserProfile, TripIntent } from "@/types";
import type { CityWithDays, FlightSkeleton } from "@/lib/flights/types";
import { formatDateShort, daysBetween } from "@/lib/utils/date";

// ============================================================
// System Prompt
// ============================================================

export const SYSTEM_PROMPT_V1 = `You are an expert multi-country trip planner with deep local knowledge of Asia, Europe, and Latin America. You specialise in building highly personalised, day-by-day travel itineraries that feel like they were written by a well-travelled friend who has actually been to each place.

Your output is ALWAYS a single, valid JSON object — nothing else. No markdown, no code blocks, no explanation text. Just the raw JSON.

## Quality Standard

Every activity object must match this depth:
- "name": Short, specific name (e.g. "Senso-ji Temple", not "temple visit")
- "category": One of: culture, food, nature, explore, adventure, transport, art, wellness, nightlife, shopping
- "icon": A single relevant emoji
- "why": 1–2 sentence explanation of why this is worth doing — specific, enthusiastic, informative
- "duration": Realistic time estimate (e.g. "2h", "45min", "3h")
- "tip": (optional but strongly preferred) A practical insider tip that adds real value
- "food": (optional) Specific food recommendation with dish name + venue name where possible
- "cost": (optional) Estimated cost per person in euros (e.g. "Free", "€15", "€25–40")

## Travel Day Rules

For days where travel between cities happens:
- Set "isTravel": true
- Set "travelFrom": departure city name
- Set "travelTo": arrival city name
- Set "travelDuration": realistic duration including check-in/transit time
- Include a transport activity as the first activity
- Still include 1–2 activities for the arrival city in the evening

## Budget Realism

The budget breakdown must be realistic and sum correctly:
- "total" must equal flights + accommodation + activities + food + transport
- "budget" must equal the user's stated budget
- Use the travel style as a guide: backpacker = budget hostels + street food; comfort = 3–4 star + mix; luxury = 5-star + fine dining

## Route Logic

The route must make geographic sense (minimise backtracking). For each city stop, provide:
- Realistic latitude/longitude
- Appropriate ISO country code (JP, VN, TH, etc.)
- A slug-safe "id" (lowercase, no spaces)`;

// ============================================================
// Prompt Assembly
// ============================================================

export function assemblePrompt(
  profile: UserProfile,
  intent: TripIntent,
  skeleton?: FlightSkeleton,
  cities?: CityWithDays[]
): string {
  const durationDays = intent.dateStart && intent.dateEnd
    ? daysBetween(intent.dateStart, intent.dateEnd)
    : 21;

  const styleDescriptions: Record<string, string> = {
    backpacker: "backpacker style (hostels, dorms, street food, maximum adventure, budget-conscious)",
    comfort: "comfort style (3–4 star hotels, mix of local restaurants and mid-range dining, good balance of adventure and relaxation)",
    luxury: "luxury style (5-star hotels, fine dining, private tours, premium experiences)",
  };

  // ── Build flight skeleton block (when Amadeus optimization succeeded) ──
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

  // When cities are pre-selected (skeleton or Haiku), lock the route; otherwise let Claude choose.
  const isCountryTrip = intent.tripType === "single-country" && intent.destinationCountry;
  const cityRequirement = cities
    ? "Use EXACTLY the cities listed in the CITY SCHEDULE above — do not add or remove cities."
    : isCountryTrip
    ? `1. Choose 3–6 cities within ${intent.destinationCountry} that make geographic sense and are popular for this type of trip`
    : "1. Choose 4–7 cities across the region that make geographic sense and are popular for this type of trip";

  const budgetRequirement = skeleton
    ? `Make the accommodation, food, activities, and transport breakdown realistic — budget.flights is already fixed at €${Math.round(skeleton.totalFlightCost).toLocaleString()}`
    : "6. Make the budget breakdown realistic for the travel style and number of travelers";

  return `Plan a ${durationDays}-day trip for ${intent.travelers} traveler(s) with the following details:

**Traveler Profile:**
- Nationality: ${profile.nationality}
- Home airport: ${profile.homeAirport}
- Travel style: ${styleDescriptions[profile.travelStyle] ?? profile.travelStyle}
- Interests: ${profile.interests.length > 0 ? profile.interests.join(", ") : "general travel"}

**Trip Parameters:**
- ${isCountryTrip ? `Country: ${intent.destinationCountry}` : `Region: ${intent.region}`}
- Start date: ${intent.dateStart || "October 1"}
- End date: ${intent.dateEnd || `October ${durationDays}`}
- Total budget: €${intent.budget.toLocaleString()} for ${intent.travelers} traveler(s)
- Flexible dates: ${intent.flexibleDates ? "yes (±3 days)" : "no"}
${skeletonBlock}
**Requirements:**
${cityRequirement}
2. Allocate days per city proportionally (longer stays in richer destinations)
3. Plan 3–4 activities per day with FULL detail (name, category, icon, why, duration, plus tip/food/cost where applicable)
4. Include realistic travel days when moving between cities (flight/train/bus with cost and duration)
5. Tailor activity choices to the traveler's stated interests and travel style
${budgetRequirement}
7. EVERY activity should feel like a recommendation from a local — specific venues, practical tips, honest costs

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
      "activities": [
        {
          "name": "Senso-ji Temple",
          "category": "culture",
          "icon": "⛩️",
          "why": "Tokyo's oldest temple — stunning Kaminarimon gate and Nakamise shopping street lined with traditional crafts",
          "duration": "2h",
          "tip": "Visit before 9am to avoid crowds and get the best photos",
          "food": "Try melon pan from a street stall on Nakamise-dori",
          "cost": "Free"
        }
      ]
    },
    {
      "day": 6,
      "date": "Oct 6",
      "city": "Kyoto",
      "isTravel": true,
      "travelFrom": "Tokyo",
      "travelTo": "Kyoto",
      "travelDuration": "2h 15min (Shinkansen)",
      "activities": [
        {
          "name": "Shinkansen to Kyoto",
          "category": "transport",
          "icon": "🚅",
          "why": "The bullet train experience is a highlight in itself — 300km/h through Japanese countryside with views of Mt. Fuji",
          "duration": "2h 15min",
          "tip": "Book a window seat on the right side (facing Kyoto) for Mt. Fuji views",
          "cost": "€120"
        },
        {
          "name": "Fushimi Inari Shrine",
          "category": "culture",
          "icon": "⛩️",
          "why": "10,000 vermillion torii gates winding up a sacred mountainside — Kyoto's most iconic sight",
          "duration": "2.5h",
          "tip": "Hike past the midpoint where 90% of tourists turn back for a completely different experience",
          "cost": "Free"
        }
      ]
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
