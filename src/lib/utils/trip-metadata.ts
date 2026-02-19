import type { CityStop, Itinerary, TripBudget } from "@/types";

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

/** Return "✓ €X under budget" or "⚠ €X over budget". */
export function getBudgetStatus(budget: TripBudget): string {
  const diff = budget.budget - budget.total;
  return diff > 0
    ? `✓ €${diff.toLocaleString()} under budget`
    : `⚠ €${Math.abs(diff).toLocaleString()} over budget`;
}
