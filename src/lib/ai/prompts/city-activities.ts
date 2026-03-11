// ============================================================
// Travel Pro — Prompt Template: Per-City Activity Generation
// Generates activities for a single city within an existing route.
// Called on-demand when the user clicks "Get recommendations".
// ============================================================

import type { UserProfile, TripIntent, CityStop, TripDay } from "@/types";

// ============================================================
// System Prompt
// ============================================================

export const SYSTEM_PROMPT_CITY_ACTIVITIES = `You are an expert travel guide with deep local knowledge. You create meticulously detailed day-by-day activity plans for a specific city, with recommendations that feel like they were written by a well-travelled friend who has actually been there.

Your output is ALWAYS a single, valid JSON object — nothing else. No markdown, no code blocks, no explanation text. Just the raw JSON.

## Quality Standard

Every activity object must match this depth:
- "name": Short, specific name (e.g. "Senso-ji Temple", not "temple visit")
- "category": One of: culture, food, nature, explore, adventure, transport, art, wellness, nightlife, shopping
- "why": 1–2 sentence explanation of why this is worth doing — specific, enthusiastic, informative
- "duration": Realistic time estimate (e.g. "2h", "45min", "3h")
- "tip": (optional) Brief practical tip (max 15 words)
- "food": (optional) Dish + venue name (max 10 words)

## Travel Day Rules

For days marked as travel days (isTravel: true):
- Include a transport activity as the first activity
- Still include 1–2 activities for the arrival/departure city
- Keep the total activity count lower (2–3 max)

## Regular Day Rules

- Plan activities per day according to the traveler's stated pace:
  - relaxed: 2–3 activities (slow mornings, plenty of downtime)
  - moderate: 3–4 activities (good mix of sightseeing and rest)
  - active: 5–6 activities (packed schedule, maximum sightseeing)
- Rotate through different neighborhoods/districts each day
- Tailor activity choices to the traveler's interests and travel style
- EVERY activity should feel like a recommendation from a local`;

// ============================================================
// Prompt Assembly
// ============================================================

export function assembleCityActivitiesPrompt(
  profile: UserProfile,
  intent: TripIntent,
  city: CityStop,
  cityDays: TripDay[]
): string {
  const styleDescriptions: Record<string, string> = {
    backpacker:
      "backpacker style (street food, free attractions, maximum adventure, budget-conscious)",
    "smart-budget":
      "smart budget style (well-priced restaurants, efficient logistics, a strong balance of quality and cost)",
    "comfort-explorer":
      "comfort explorer style (standout dining, curated experiences, more comfort and polish throughout the day)",
    luxury: "luxury style (fine dining, private tours, premium experiences)",
  };

  const paceDescriptions: Record<string, string> = {
    relaxed: "relaxed (2–3 activities per day, slow mornings, plenty of downtime)",
    moderate: "balanced (3–4 activities per day, good mix of sightseeing and rest)",
    active: "active (5–6 activities per day, packed schedule, maximum sightseeing)",
  };
  // Fall back to moderate if pace is not set
  const paceDescription = profile.pace ? paceDescriptions[profile.pace] : paceDescriptions.moderate;
  const paceActivityCount =
    profile.pace === "relaxed" ? "2–3" : profile.pace === "active" ? "5–6" : "3–4";

  const daysDescription = cityDays
    .map((d) => {
      let desc = `  - Day ${d.day} (${d.date})`;
      if (d.isTravel) {
        desc += ` [TRAVEL DAY: ${d.travelFrom} → ${d.travelTo}, ${d.travelDuration || "unknown duration"}]`;
      }
      return desc;
    })
    .join("\n");

  const exampleDay = cityDays[0];
  const exampleIsTravel = exampleDay?.isTravel ?? false;

  return `Generate detailed activity recommendations for ${city.city}, ${city.country} as part of a trip.

**Traveler Profile:**
- Nationality: ${profile.nationality}
- Home airport: ${profile.homeAirport}
- Travel style: ${styleDescriptions[profile.travelStyle] ?? profile.travelStyle}
- Trip pace: ${paceDescription}
- Interests: ${profile.interests.length > 0 ? profile.interests.join(", ") : "general travel"}

**Trip Context:**
- Region: ${intent.region || `${city.city}, ${city.country}`}
- This city: ${city.city}, ${city.country} — ${cityDays.length} day(s)
${intent.description?.trim() ? `\n**Special Requests from the traveler:**\n${intent.description.trim()}\n` : ""}
**Days to fill with activities:**
${daysDescription}

**Requirements:**
1. Generate ${paceActivityCount} activities per regular day (match the traveler's stated pace), 2–3 for travel days
2. Include FULL detail for every activity (name, category, why, duration, plus tip/food where applicable)
3. Rotate through different neighborhoods/districts
4. On travel days, include a transport activity first, then 1–2 activities
5. Tailor choices to the traveler's interests and travel style
6. EVERY activity should feel like a recommendation from a local — specific venues, practical tips

Return ONLY this JSON structure — one entry per day listed above:

{
  "days": [
    {
      "day": ${exampleDay?.day ?? 1},
      "date": "${exampleDay?.date ?? "Oct 1"}",
      "city": "${city.city}",
      "isTravel": ${exampleIsTravel},${
        exampleIsTravel
          ? `
      "travelFrom": "${exampleDay?.travelFrom ?? ""}",
      "travelTo": "${exampleDay?.travelTo ?? ""}",
      "travelDuration": "${exampleDay?.travelDuration ?? ""}",`
          : ""
      }
      "activities": [
        {
          "name": "Example Activity",
          "category": "explore",
          "why": "Description of why this is worth doing",
          "duration": "2h",
          "tip": "Arrive early to beat crowds",
          "food": "Try melon pan at Nakamise-dori"
        }
      ]
    }
  ]
}`;
}
