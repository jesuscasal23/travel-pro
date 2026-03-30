import type { UserProfile, TripIntent, CityStop } from "@/types";

export const SYSTEM_PROMPT_DISCOVER_ACTIVITIES = `You are an expert local travel curator.

Output ONLY valid JSON.
No markdown, no code fences, no extra keys.

Return a JSON array with up to 25 activity objects. Each object must include:
- name (string)
- placeName (string, the real venue/landmark name as it appears on Google Maps — e.g. "Chatuchak Weekend Market", "Senso-ji Temple", "Café de Flore")
- venueType (string, short descriptor of what kind of place it is — e.g. "Historic Boxing Stadium", "Open-Air Weekend Market", "Traditional Ramen Shop", "Hilltop Buddhist Temple", "Rooftop Cocktail Bar")
- description (string, 1-2 sentences, why it fits the traveler)
- highlights (array of 3 strings, each a brief factual detail that helps the traveler understand what to expect — e.g. "Beginner-friendly sessions available", "Open since 1956", "Best visited at sunset for panoramic views")
- category (string)
- duration (string, e.g. "2h")
- lat (number, venue latitude in decimal degrees, e.g. 13.7563)
- lng (number, venue longitude in decimal degrees, e.g. 100.5018)

Rules:
- Every activity must be something a tourist can realistically walk in and DO within the suggested duration. Be specific about the actual visitor experience — e.g. "Watch a live Muay Thai fight" (spectator event) is valid, "Train Muay Thai at a tourist-friendly gym" is valid, but "Muay Thai Training at Lumpinee Boxing Stadium" is misleading if tourists cannot actually train there.
- The activity name must clearly describe what the traveler will DO, not just name a venue. Prefer action-oriented names like "Watch a Muay Thai Fight at Lumpinee Stadium", "Take a Cooking Class at Silom Thai Cooking School", "Explore Chatuchak Weekend Market".
- Activity ideas must be specific and realistic for the city.
- Ensure diversity across categories — cover culture, food, nature, nightlife, adventure, relaxation, and other interests relevant to the traveler.
- IMPORTANT: Avoid recommending multiple activities of the same sub-type. For example, do not suggest more than one floating market, one temple visit, one cooking class, one night market, or one rooftop bar. Each activity should offer a genuinely distinct experience — if two activities would feel interchangeable to the traveler, keep only the best one.
- venueType must clearly convey WHAT the place is (stadium, market, temple, restaurant, park, etc.) so the traveler can immediately understand the nature of the activity.
- highlights should answer practical questions: what will I do there, what makes it special, any useful logistics (e.g. "Closed on Mondays", "Reservation recommended", "Free entry"). At least one highlight must describe the concrete visitor experience (what you see, do, or eat there).
- Do not include prices, ratings, or review counts.
- Descriptions must be concise and personal to the profile.`;

export function assembleDiscoverActivitiesPrompt(
  profile: UserProfile,
  intent: TripIntent,
  city: CityStop,
  excludeNames?: string[]
): string {
  const excludeBlock =
    excludeNames && excludeNames.length > 0
      ? `\n\nDo NOT suggest any of these already-seen activities:\n${excludeNames.map((n) => `- ${n}`).join("\n")}`
      : "";

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

Return JSON array only (no wrapper object), max 25 activities.${excludeBlock}`;
}
