import type { Itinerary, FlightSelection, HotelSelection } from "@/types";

// ============================================================
// Budget calculation utilities
// ============================================================

/**
 * Parse a cost string like "€45", "~€100", "$30", "€10-15", "Free" into a
 * numeric EUR value. Returns null if unparseable.
 *
 * For ranges like "€10-15", returns the midpoint.
 * For approximate values like "~€100", returns the number as-is.
 * Currency conversion is not attempted — all values treated as EUR.
 */
export function parseCost(raw: string | undefined | null): number | null {
  if (!raw) return null;

  const s = raw.trim().toLowerCase();
  if (s === "free" || s === "0") return 0;

  // Strip leading ~, currency symbols, and whitespace
  const cleaned = s.replace(/^[~≈]?\s*/, "").replace(/[€$£¥₹]\s*/g, "");

  // Range: "10-15" or "10 - 15"
  const rangeMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    return (low + high) / 2;
  }

  // Single number: "45" or "45.50"
  const singleMatch = cleaned.match(/^(\d+(?:\.\d+)?)$/);
  if (singleMatch) {
    return parseFloat(singleMatch[1]);
  }

  return null;
}

/** Activity cost grouped by city */
interface CityActivityBudget {
  city: string;
  items: { name: string; cost: number }[];
  total: number;
}

/**
 * Derive per-city activity cost breakdowns from itinerary days.
 * Only includes activities with parseable cost strings.
 */
export function deriveCityActivityBudgets(days: Itinerary["days"]): CityActivityBudget[] {
  const cityMap = new Map<string, { name: string; cost: number }[]>();

  for (const day of days) {
    for (const activity of day.activities) {
      const cost = parseCost(activity.cost);
      if (cost === null || cost === 0) continue;

      const items = cityMap.get(day.city) ?? [];
      // Avoid duplicates (same activity appearing on multiple days)
      if (!items.some((i) => i.name === activity.name)) {
        items.push({ name: activity.name, cost });
      }
      cityMap.set(day.city, items);
    }
  }

  return Array.from(cityMap.entries()).map(([city, items]) => ({
    city,
    items,
    total: items.reduce((sum, i) => sum + i.cost, 0),
  }));
}

/** Summarized budget for the budget cards */
export interface BudgetSummary {
  flights: { total: number; source: "selections" | "search" } | null;
  hotels: { total: number; source: "selections" | "enrichment" } | null;
  activities: { total: number } | null;
  grandTotal: number | null;
}

/**
 * Compute the budget summary from all available data sources.
 * Priority: user selections > itinerary enrichment data > null.
 */
export function computeBudgetSummary(
  itinerary: Itinerary | null,
  flightSelections: FlightSelection[] | undefined,
  hotelSelections: HotelSelection[] | undefined
): BudgetSummary {
  // Flights: selections first, then flightOptions cheapest per leg
  let flights: BudgetSummary["flights"] = null;
  if (flightSelections && flightSelections.length > 0) {
    flights = {
      total: flightSelections.reduce((sum, f) => sum + f.price, 0),
      source: "selections",
    };
  } else if (itinerary?.flightOptions && itinerary.flightOptions.length > 0) {
    const total = itinerary.flightOptions.reduce((sum, leg) => {
      const cheapest = leg.results[0];
      return sum + (cheapest?.price ?? 0);
    }, 0);
    if (total > 0) {
      flights = { total, source: "search" };
    }
  }

  // Hotels: selections first, then enrichment
  let hotels: BudgetSummary["hotels"] = null;
  if (hotelSelections && hotelSelections.length > 0) {
    const total = hotelSelections.reduce((sum, h) => sum + (h.totalPrice ?? 0), 0);
    if (total > 0) {
      hotels = { total, source: "selections" };
    }
  } else if (itinerary?.accommodationData && itinerary.accommodationData.length > 0) {
    const total = itinerary.accommodationData.reduce((sum, city) => {
      // Use cheapest hotel per city as estimate
      const cheapest = city.hotels.reduce<number | null>((min, h) => {
        if (h.totalPrice == null) return min;
        return min === null ? h.totalPrice : Math.min(min, h.totalPrice);
      }, null);
      return sum + (cheapest ?? 0);
    }, 0);
    if (total > 0) {
      hotels = { total, source: "enrichment" };
    }
  }

  // Activities: parse from itinerary days
  let activities: BudgetSummary["activities"] = null;
  if (itinerary?.days) {
    const cityBudgets = deriveCityActivityBudgets(itinerary.days);
    const total = cityBudgets.reduce((sum, c) => sum + c.total, 0);
    if (total > 0) {
      activities = { total };
    }
  }

  // Grand total: only sum available categories
  const parts = [flights?.total, hotels?.total, activities?.total].filter(
    (v): v is number => v != null
  );
  const grandTotal = parts.length > 0 ? parts.reduce((a, b) => a + b, 0) : null;

  return { flights, hotels, activities, grandTotal };
}
