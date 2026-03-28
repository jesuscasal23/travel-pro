import type { Itinerary } from "@/types";

/** Check if a specific city has activities generated. */
export function cityHasActivities(itinerary: Itinerary, cityId: string): boolean {
  const stop = itinerary.route.find((r) => r.id === cityId);
  if (!stop) return false;

  return itinerary.days.some((d) => d.city === stop.city && d.activities.length > 0);
}
