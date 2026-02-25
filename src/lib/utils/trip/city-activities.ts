import type { Itinerary } from "@/types";

/** Returns the set of city IDs that have at least one activity generated. */
export function citiesWithActivities(itinerary: Itinerary): Set<string> {
  const cityIds = new Set<string>();
  const cityNameToId = new Map<string, string>();

  for (const stop of itinerary.route) {
    cityNameToId.set(stop.city, stop.id);
  }

  for (const day of itinerary.days) {
    if (day.activities.length > 0) {
      const id = cityNameToId.get(day.city);
      if (id) cityIds.add(id);
    }
  }

  return cityIds;
}

/** Check if a specific city has activities generated. */
export function cityHasActivities(itinerary: Itinerary, cityId: string): boolean {
  const stop = itinerary.route.find((r) => r.id === cityId);
  if (!stop) return false;

  return itinerary.days.some(
    (d) => d.city === stop.city && d.activities.length > 0
  );
}
