// ============================================================
// Fichi — Trip Preparation Progress Calculator
// Derives a checklist + percentage from itinerary route + booking clicks
// ============================================================

import type { BookingClick, BookingClickMetadata, CityStop, FlightDirection } from "@/types";

export type PrepItemType = "flight" | "hotel" | "visa";

export interface PrepItem {
  type: PrepItemType;
  label: string;
  /** For flights: direction. For hotels: city name. For visa: "visa". */
  key: string;
  booked: boolean;
  /** The booking click ID if matched, undefined otherwise */
  clickId?: string;
  /** Flight direction — only present for flight items */
  direction?: FlightDirection;
  /** City name — only present for hotel items */
  city?: string;
  /** Whether this is a beta/non-functional item */
  beta?: boolean;
}

interface TripPreparationProgress {
  percentage: number;
  items: PrepItem[];
  totalItems: number;
  completedItems: number;
}

/** Human-readable label for a flight direction */
function flightLabel(direction: FlightDirection, fromIata?: string, toIata?: string): string {
  const route = fromIata && toIata ? ` (${fromIata} → ${toIata})` : "";
  switch (direction) {
    case "outbound":
      return `Outbound flight${route}`;
    case "return":
      return `Return flight${route}`;
    case "internal":
      return `Internal flight${route}`;
  }
}

/**
 * Find a confirmed booking click matching a flight leg by direction.
 * Falls back to matching by IATA pair if direction is not stored.
 */
function findFlightClick(
  clicks: BookingClick[],
  direction: FlightDirection,
  fromIata: string,
  toIata: string
): BookingClick | undefined {
  // First: match by direction (preferred)
  const byDirection = clicks.find((c) => {
    if (c.clickType !== "flight" || !c.metadata) return false;
    const m = c.metadata as BookingClickMetadata;
    return m.type === "flight" && m.direction === direction && c.bookingConfirmed === true;
  });
  if (byDirection) return byDirection;

  // Fallback: match by IATA pair
  return clicks.find((c) => {
    if (c.clickType !== "flight" || !c.metadata) return false;
    const m = c.metadata as BookingClickMetadata;
    return (
      m.type === "flight" &&
      m.fromIata === fromIata &&
      m.toIata === toIata &&
      c.bookingConfirmed === true
    );
  });
}

/** Find a confirmed hotel booking click for a city */
function findHotelClick(clicks: BookingClick[], city: string): BookingClick | undefined {
  return clicks.find((c) => {
    if (c.clickType !== "hotel" || c.bookingConfirmed !== true) return false;
    // Match by metadata city or click city field
    if (c.metadata) {
      const m = c.metadata as BookingClickMetadata;
      if (m.type === "hotel" && m.city?.toLowerCase() === city.toLowerCase()) return true;
    }
    return c.city?.toLowerCase() === city.toLowerCase();
  });
}

/**
 * Compute trip preparation progress from itinerary route and booking clicks.
 *
 * For a trip with N cities:
 * - Flight items: N+1 legs (outbound + N-1 internal + return)
 * - Hotel items: N (one per city)
 * - Visa item: 1 (always present, always incomplete — beta)
 *
 * For single-city: 2 flights + 1 hotel + 1 visa = 4 items
 */
export function computeTripPreparation(
  route: CityStop[],
  clicks: BookingClick[],
  homeIata?: string
): TripPreparationProgress {
  const items: PrepItem[] = [];

  if (route.length === 0) {
    return { percentage: 0, items: [], totalItems: 0, completedItems: 0 };
  }

  // ── Flight legs ──
  const firstCity = route[0];
  const lastCity = route[route.length - 1];

  // Outbound: home → first city
  if (homeIata && firstCity.iataCode) {
    const click = findFlightClick(clicks, "outbound", homeIata, firstCity.iataCode);
    items.push({
      type: "flight",
      label: flightLabel("outbound", homeIata, firstCity.iataCode),
      key: "flight-outbound",
      booked: !!click,
      clickId: click?.id,
      direction: "outbound",
    });
  }

  // Internal legs: city[i] → city[i+1]
  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i];
    const to = route[i + 1];
    if (!from.iataCode || !to.iataCode) continue;
    const click = findFlightClick(clicks, "internal", from.iataCode, to.iataCode);
    items.push({
      type: "flight",
      label: flightLabel("internal", from.iataCode, to.iataCode),
      key: `flight-internal-${from.iataCode}-${to.iataCode}`,
      booked: !!click,
      clickId: click?.id,
      direction: "internal",
    });
  }

  // Return: last city → home
  if (homeIata && lastCity.iataCode) {
    const click = findFlightClick(clicks, "return", lastCity.iataCode, homeIata);
    items.push({
      type: "flight",
      label: flightLabel("return", lastCity.iataCode, homeIata),
      key: "flight-return",
      booked: !!click,
      clickId: click?.id,
      direction: "return",
    });
  }

  // ── Hotels (one per city) ──
  for (const cityStop of route) {
    const click = findHotelClick(clicks, cityStop.city);
    items.push({
      type: "hotel",
      label: `Accommodation in ${cityStop.city}`,
      key: `hotel-${cityStop.city}`,
      booked: !!click,
      clickId: click?.id,
      city: cityStop.city,
    });
  }

  // ── Visa (beta — always incomplete) ──
  items.push({
    type: "visa",
    label: "Visa requirements",
    key: "visa",
    booked: false,
    beta: true,
  });

  // Visa doesn't count toward percentage since it's beta
  const countableItems = items.filter((i) => !i.beta);
  const countableCompleted = countableItems.filter((i) => i.booked).length;
  const percentage =
    countableItems.length > 0 ? Math.round((countableCompleted / countableItems.length) * 100) : 0;

  return {
    percentage,
    items,
    totalItems: countableItems.length,
    completedItems: countableCompleted,
  };
}
