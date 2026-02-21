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
- "icon": A single relevant emoji
- "why": 1–2 sentence explanation of why this is worth doing — specific, enthusiastic, informative
- "duration": Realistic time estimate (e.g. "2h", "45min", "3h")
- "tip": (optional but strongly preferred) A practical insider tip that adds real value
- "food": (optional) Specific food recommendation with dish name + venue name where possible
- "cost": (optional) Estimated cost per person in euros (e.g. "Free", "€15", "€25–40")

## Travel Day Rules

For days marked as travel days (isTravel: true):
- Include a transport activity as the first activity
- Still include 1–2 activities for the arrival/departure city
- Keep the total activity count lower (2–3 max)

## Regular Day Rules

- Plan 3–5 activities per day with FULL detail
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
    backpacker: "backpacker style (street food, free attractions, maximum adventure, budget-conscious)",
    comfort: "comfort style (mix of local restaurants and mid-range dining, good balance of adventure and relaxation)",
    luxury: "luxury style (fine dining, private tours, premium experiences)",
  };

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
- Interests: ${profile.interests.length > 0 ? profile.interests.join(", ") : "general travel"}

**Trip Context:**
- Region: ${intent.region || `${city.city}, ${city.country}`}
- Total budget: €${intent.budget.toLocaleString()} for ${intent.travelers} traveler(s)
- This city: ${city.city}, ${city.country} — ${cityDays.length} day(s)

**Days to fill with activities:**
${daysDescription}

**Requirements:**
1. Generate 3–5 activities per regular day, 2–3 for travel days
2. Include FULL detail for every activity (name, category, icon, why, duration, plus tip/food/cost where applicable)
3. Rotate through different neighborhoods/districts
4. On travel days, include a transport activity first, then 1–2 activities
5. Tailor choices to the traveler's interests and travel style
6. EVERY activity should feel like a recommendation from a local — specific venues, practical tips, honest costs

Return ONLY this JSON structure — one entry per day listed above:

{
  "days": [
    {
      "day": ${exampleDay?.day ?? 1},
      "date": "${exampleDay?.date ?? "Oct 1"}",
      "city": "${city.city}",
      "isTravel": ${exampleIsTravel},${exampleIsTravel ? `
      "travelFrom": "${exampleDay?.travelFrom ?? ""}",
      "travelTo": "${exampleDay?.travelTo ?? ""}",
      "travelDuration": "${exampleDay?.travelDuration ?? ""}",` : ""}
      "activities": [
        {
          "name": "Example Activity",
          "category": "explore",
          "icon": "🏙️",
          "why": "Description of why this is worth doing",
          "duration": "2h",
          "tip": "Practical insider tip",
          "food": "Specific food recommendation",
          "cost": "€15"
        }
      ]
    }
  ]
}`;
}
