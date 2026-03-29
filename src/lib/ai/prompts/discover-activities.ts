import type { UserProfile, TripIntent, CityStop } from "@/types";

export const SYSTEM_PROMPT_DISCOVER_ACTIVITIES = `You are an expert local travel curator.

Output ONLY valid JSON.
No markdown, no code fences, no extra keys.

Return a JSON array with up to 25 activity objects. Each object must include:
- name (string)
- placeName (string, the real venue/landmark name as it appears on Google Maps — e.g. "Chatuchak Weekend Market", "Senso-ji Temple", "Café de Flore")
- description (string, 1-2 sentences, why it fits the traveler)
- category (string)
- duration (string, e.g. "2h")

Rules:
- Activity ideas must be specific and realistic for the city.
- Ensure diversity across categories — cover culture, food, nature, nightlife, adventure, relaxation, and other interests relevant to the traveler.
- IMPORTANT: Avoid recommending multiple activities of the same sub-type. For example, do not suggest more than one floating market, one temple visit, one cooking class, one night market, or one rooftop bar. Each activity should offer a genuinely distinct experience — if two activities would feel interchangeable to the traveler, keep only the best one.
- Do not include prices, ratings, or review counts.
- Descriptions must be concise and personal to the profile.`;

export function assembleDiscoverActivitiesPrompt(
  profile: UserProfile,
  intent: TripIntent,
  city: CityStop
): string {
  return `Generate activity swipe cards for this trip.

Traveler profile:
- Nationality: ${profile.nationality}
- Home airport: ${profile.homeAirport}
- Travel style: ${profile.travelStyle}
- Interests: ${profile.interests.join(", ") || "general exploration"}
- Pace: ${profile.pace ?? "moderate"}

Trip context:
- Trip type: ${intent.tripType ?? "multi-city"}
- Region: ${intent.region || "n/a"}
- Date range: ${intent.dateStart} to ${intent.dateEnd}
- Travelers: ${intent.travelers}

Target city:
- City: ${city.city}
- Country: ${city.country}
- Country code: ${city.countryCode}

Return JSON array only (no wrapper object), max 25 activities.`;
}
