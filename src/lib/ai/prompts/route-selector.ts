// ============================================================
// Travel Pro — Route Selector (Stage A)
// Uses claude-haiku to pick cities + IATA codes cheaply and fast.
// ============================================================

import type Anthropic from "@anthropic-ai/sdk";
import type { UserProfile, TripIntent } from "@/types";
import type { CityWithDays } from "@/lib/flights/types";
import { daysBetween } from "@/lib/utils/format/date";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("ai:route-selector");

const SYSTEM = `You are a travel route planning expert. Your only job is to select the best cities for a multi-city trip and return a JSON array — nothing else. No markdown, no explanation, just raw JSON starting with [`;

export async function selectRoute(
  profile: UserProfile,
  intent: TripIntent,
  anthropic: Anthropic,
  signal?: AbortSignal
): Promise<CityWithDays[]> {
  const durationDays =
    intent.dateStart && intent.dateEnd ? daysBetween(intent.dateStart, intent.dateEnd) : 21;

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
${intent.description?.trim() ? `- Traveler notes: ${intent.description.trim()}` : ""}
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

  const t0 = Date.now();
  log.info("selectRoute: calling Claude Haiku", {
    tripId: intent.id,
    region: intent.region,
    tripType: intent.tripType,
    durationDays,
    sightseeingDays,
    travelStyle: profile.travelStyle,
    interests: profile.interests,
    promptLength: prompt.length,
  });

  const message = await anthropic.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    },
    { signal }
  );

  const block = message.content[0];
  log.info("selectRoute: Claude response received", {
    tripId: intent.id,
    duration: `${Date.now() - t0}ms`,
    model: message.model,
    stopReason: message.stop_reason,
    inputTokens: message.usage?.input_tokens,
    outputTokens: message.usage?.output_tokens,
    contentBlockType: block?.type,
  });

  if (block.type !== "text") {
    log.error("selectRoute: non-text response", {
      tripId: intent.id,
      contentBlockType: block.type,
    });
    throw new Error("Route selector returned non-text");
  }

  const jsonMatch = block.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    log.error("selectRoute: no JSON array in response", {
      tripId: intent.id,
      responseText: block.text.slice(0, 500),
    });
    throw new Error("Route selector did not return a JSON array");
  }

  let parsed: CityWithDays[];
  try {
    parsed = JSON.parse(jsonMatch[0]) as CityWithDays[];
  } catch (e) {
    log.error("selectRoute: JSON parse failed", {
      tripId: intent.id,
      error: e instanceof Error ? e.message : String(e),
      jsonSnippet: jsonMatch[0].slice(0, 300),
    });
    throw e;
  }

  if (!Array.isArray(parsed) || parsed.length < 2) {
    log.error("selectRoute: invalid city array", {
      tripId: intent.id,
      isArray: Array.isArray(parsed),
      length: Array.isArray(parsed) ? parsed.length : 0,
      parsed,
    });
    throw new Error("Route selector returned invalid city array");
  }

  log.info("selectRoute: complete", {
    tripId: intent.id,
    duration: `${Date.now() - t0}ms`,
    cityCount: parsed.length,
    cities: parsed.map((c) => ({
      city: c.city,
      country: c.country,
      iataCode: c.iataCode,
      minDays: c.minDays,
      maxDays: c.maxDays,
    })),
  });

  return parsed;
}
