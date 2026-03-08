import type { CityStop, Itinerary } from "@/types";
import { itinerarySchema } from "@/lib/itinerary/schema";

/** Parse Prisma JSON `data` into a validated Itinerary. */
export function parseItineraryData(data: unknown): Itinerary {
  const result = itinerarySchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Stored itinerary data is invalid: ${issues}`);
  }
  return result.data;
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
