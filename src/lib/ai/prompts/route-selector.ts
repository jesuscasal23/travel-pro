// ============================================================
// Travel Pro — Route Selector (Stage A)
// Uses claude-haiku to pick cities + IATA codes cheaply and fast.
// ============================================================

import type Anthropic from "@anthropic-ai/sdk";
import type { UserProfile, TripIntent } from "@/types";
import type { CityWithDays } from "@/lib/flights/types";
import { daysBetween } from "@/lib/utils/date";

const SYSTEM = `You are a travel route planning expert. Your only job is to select the best cities for a multi-city trip and return a JSON array — nothing else. No markdown, no explanation, just raw JSON starting with [`;

export async function selectRoute(
  profile: UserProfile,
  intent: TripIntent,
  anthropic: Anthropic
): Promise<CityWithDays[]> {
  const durationDays =
    intent.dateStart && intent.dateEnd
      ? daysBetween(intent.dateStart, intent.dateEnd)
      : 21;

  // Sightseeing days available = total days - one travel day per flight
  // For N cities: N+1 flights → N+1 travel days → sightseeing = totalDays - N - 1
  // Since N is unknown at this stage, approximate as totalDays × 0.7
  const sightseeingDays = Math.round(durationDays * 0.7);

  const isCountryTrip = intent.tripType === "single-country" && intent.destinationCountry;
  const regionLine = isCountryTrip
    ? `- Country: ${intent.destinationCountry} (select cities ONLY within this country)`
    : `- Region: ${intent.region}`;
  const cityCountRule = isCountryTrip
    ? "- Choose 3–6 cities in geographic order that minimise backtracking"
    : "- Choose 4–7 cities in geographic order that minimise backtracking";
  const countryConstraint = isCountryTrip
    ? `\n- ALL cities MUST be within ${intent.destinationCountry}. Do NOT include cities from other countries.`
    : "";

  const prompt = `Select the best cities for this trip and return ONLY a JSON array (no other text).

Trip details:
${regionLine}
- Total trip days: ${durationDays}
- Estimated sightseeing days across all cities: ~${sightseeingDays}
- Travel style: ${profile.travelStyle}
- Interests: ${profile.interests.join(", ") || "general travel"}
- Home airport: ${profile.homeAirport}

Rules:
${cityCountRule}${countryConstraint}
- Provide the main international airport IATA code for each city
- minDays and maxDays: realistic stay range with a difference of 2–3 days
- The sum of minDays across all cities should be roughly ${Math.round(sightseeingDays * 0.8)}

Return ONLY a JSON array, example:
[
  {
    "id": "tokyo",
    "city": "Tokyo",
    "country": "Japan",
    "countryCode": "JP",
    "iataCode": "NRT",
    "lat": 35.68,
    "lng": 139.69,
    "minDays": 3,
    "maxDays": 5
  }
]`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Route selector returned non-text");

  const jsonMatch = block.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Route selector did not return a JSON array");

  const parsed = JSON.parse(jsonMatch[0]) as CityWithDays[];
  if (!Array.isArray(parsed) || parsed.length < 2) {
    throw new Error("Route selector returned invalid city array");
  }

  return parsed;
}
