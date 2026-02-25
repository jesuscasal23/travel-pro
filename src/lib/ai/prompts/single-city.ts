// ============================================================
// Travel Pro — Prompt Template: Single-City
// Focused on neighborhoods, day trips, local rhythm, hidden gems
// ============================================================

import type { UserProfile, TripIntent } from "@/types";
import { daysBetween } from "@/lib/utils/date";

// ============================================================
// System Prompt
// ============================================================

export const SYSTEM_PROMPT_SINGLE_CITY = `You are an expert city guide with encyclopaedic local knowledge. You create meticulously detailed day-by-day itineraries for a SINGLE city, exploring neighborhoods, hidden gems, day trips, and authentic local experiences that feel like they were written by a resident who genuinely loves this place.

Your output is ALWAYS a single, valid JSON object — nothing else. No markdown, no code blocks, no explanation text. Just the raw JSON.

## Focus Areas (single-city trip)

- **Neighborhoods**: Rotate through different districts each day so the traveler experiences the full character of the city
- **Day trips**: Include 1–2 nearby excursions (within 1–2 hours by train/car) if the trip is 4+ days
- **Local rhythm**: Plan around the city's natural pace — morning markets, afternoon siestas, evening food scenes
- **Depth over breadth**: 4–5 activities per day with full detail
- **No inter-city travel**: All days are full exploration days. "isTravel" is always false. Do NOT set travelFrom, travelTo, or travelDuration.

## Quality Standard

Every activity object must match this depth:
- "name": Short, specific name (e.g. "Tsukiji Outer Market breakfast", not "market visit")
- "category": One of: culture, food, nature, explore, adventure, transport, art, wellness, nightlife, shopping
- "why": 1–2 sentence explanation of why this is worth doing — specific, enthusiastic, informative
- "duration": Realistic time estimate (e.g. "2h", "45min", "3h")
- "tip": (optional) Brief practical tip (max 15 words)
- "food": (optional) Dish + venue name (max 10 words)
- "cost": (optional) Estimated cost per person in euros (e.g. "Free", "€15", "€25–40")

## Route Structure

- The "route" array must contain EXACTLY ONE city stop with all trip days assigned to it
- Do NOT include multiple cities — this is a single-destination trip`;

// ============================================================
// Prompt Assembly
// ============================================================

export function assembleSingleCityPrompt(
  profile: UserProfile,
  intent: TripIntent
): string {
  const durationDays = intent.dateStart && intent.dateEnd
    ? daysBetween(intent.dateStart, intent.dateEnd)
    : 7;

  const styleDescriptions: Record<string, string> = {
    backpacker: "backpacker style (hostels, dorms, street food, maximum adventure, budget-conscious)",
    comfort: "comfort style (3–4 star hotels, mix of local restaurants and mid-range dining, good balance of adventure and relaxation)",
    luxury: "luxury style (5-star hotels, fine dining, private tours, premium experiences)",
  };

  const paceDescriptions: Record<string, string> = {
    relaxed: "relaxed (1–2 activities per day, slow mornings, plenty of downtime)",
    moderate: "balanced (3–4 activities per day, good mix of sightseeing and rest)",
    active: "active (5+ activities per day, packed schedule, maximum sightseeing)",
  };
  const paceDescription = profile.pace ? paceDescriptions[profile.pace] : paceDescriptions.moderate;
  const paceActivityCount = profile.pace === "relaxed" ? "2–3" : profile.pace === "active" ? "5–6" : "4–5";

  return `Plan a ${durationDays}-day trip to ${intent.destination}, ${intent.destinationCountry} for ${intent.travelers} traveler(s) with the following details:

**Traveler Profile:**
- Nationality: ${profile.nationality}
- Home airport: ${profile.homeAirport}
- Travel style: ${styleDescriptions[profile.travelStyle] ?? profile.travelStyle}
- Trip pace: ${paceDescription}
- Interests: ${profile.interests.length > 0 ? profile.interests.join(", ") : "general travel"}

**Trip Parameters:**
- City: ${intent.destination}, ${intent.destinationCountry}
- Start date: ${intent.dateStart || "October 1"}
- End date: ${intent.dateEnd || `October ${durationDays}`}
${intent.description?.trim() ? `\n**Special Requests from the traveler:**\n${intent.description.trim()}\n` : ""}**Requirements:**
1. Plan the ENTIRE trip in ${intent.destination} — do NOT add other cities
2. Rotate through different neighborhoods/districts each day
3. Plan ${paceActivityCount} activities per day with FULL detail (name, category, why, duration, plus tip/food/cost where applicable) — match the traveler's stated pace
${durationDays >= 4 ? `4. Include 1–2 day trips to nearby towns or attractions (within 1–2 hours)` : "4. Focus on the city center and most iconic neighborhoods"}
5. Tailor activity choices to the traveler's stated interests and travel style
6. EVERY activity should feel like a recommendation from a local — specific venues, practical tips, honest costs

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
      "activities": [
        {
          "name": "Example Activity",
          "category": "explore",
          "why": "Description of why this is worth doing",
          "duration": "2h",
          "tip": "Arrive early to beat crowds",
          "food": "Try melon pan at Nakamise-dori",
          "cost": "€15"
        }
      ]
    }
  ]
}`;
}
