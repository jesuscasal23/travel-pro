import type { CityStop, TripBudget } from "@/types";

/** Get unique country names from a route. */
export function getUniqueCountries(route: CityStop[]): string[] {
  return [...new Set(route.map((r) => r.country))];
}

/** Derive trip title from route (e.g. "Japan, Vietnam, Thailand"). */
export function getTripTitle(route: CityStop[]): string {
  return getUniqueCountries(route).join(", ");
}

/** Return "✓ €X under budget" or "⚠ €X over budget". */
export function getBudgetStatus(budget: TripBudget): string {
  const diff = budget.budget - budget.total;
  return diff > 0
    ? `✓ €${diff.toLocaleString()} under budget`
    : `⚠ €${Math.abs(diff).toLocaleString()} over budget`;
}
