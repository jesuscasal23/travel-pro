const interestAliases: Record<string, string> = {
  surfing: "surfing",
  beach: "surfing",
  "beach & ocean": "surfing",
  food: "food",
  "food & cuisine": "food",
  culture: "culture",
  "culture & history": "culture",
  art: "culture",
  "art & design": "culture",
  shopping: "culture",
  hiking: "hiking",
  adventure: "hiking",
  "adventure sports": "hiking",
  nightlife: "nightlife",
  relaxation: "relaxation",
  wellness: "relaxation",
  "wellness & spa": "relaxation",
  nature: "nature",
  "nature & hiking": "nature",
  photography: "photography",
};

export function normalizeInterest(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return interestAliases[normalized] ?? normalized;
}

export function normalizeInterests(values: string[] | undefined | null): string[] {
  if (!values || values.length === 0) return [];

  const deduped = new Set<string>();
  for (const value of values) {
    const normalized = normalizeInterest(value);
    if (!normalized) continue;
    deduped.add(normalized);
  }

  return Array.from(deduped);
}

export function hasInterest(interests: string[], interestId: string) {
  return normalizeInterests(interests).includes(interestId);
}
