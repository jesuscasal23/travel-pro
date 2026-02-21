import type { CityStop, Itinerary } from "@/types";

/** Safely cast Prisma JSON `data` field to an Itinerary (avoids scattered double-casts). */
export function parseItineraryData(data: unknown): Itinerary {
  return data as unknown as Itinerary;
}

/** Get unique country names from a route. */
export function getUniqueCountries(route: CityStop[]): string[] {
  return [...new Set(route.map((r) => r.country))];
}

/** Runtime check: does this itinerary represent a single-city trip? */
export function isSingleCity(itinerary: Itinerary): boolean {
  return itinerary.route.length === 1;
}

/** Derive trip title from route — "Tokyo, Japan" for single-city, "Japan, Vietnam, Thailand" for multi-city. */
export function getTripTitle(route: CityStop[]): string {
  if (route.length === 1) {
    return `${route[0].city}, ${route[0].country}`;
  }
  return getUniqueCountries(route).join(", ");
}
