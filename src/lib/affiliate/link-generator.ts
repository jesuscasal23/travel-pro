// ============================================================
// Travel Pro — Affiliate Link Generator
// Builds tracked deep links for Skyscanner, Booking.com, GetYourGuide
// ============================================================

import type { CityStop } from "@/types";

const AFFILIATE_IDS = {
  skyscanner: "travel-pro",
  booking: process.env.BOOKING_AFFILIATE_ID ?? "TRAVEL_PRO_AID",
  getyourguide: process.env.GYG_PARTNER_ID ?? "TRAVEL_PRO_ID",
} as const;

interface FlightLeg {
  fromIata: string;
  toIata: string;
  departureDate: string; // YYYY-MM-DD
}

/** Build a Skyscanner deep link for a flight leg. */
export function buildFlightLink(leg: FlightLeg, travelers: number): string {
  const date = leg.departureDate.replace(/-/g, "").slice(2); // YYMMDD
  const params = new URLSearchParams({ adults: String(travelers), ref: AFFILIATE_IDS.skyscanner });
  return `https://www.skyscanner.net/transport/flights/${leg.fromIata}/${leg.toIata}/${date}/?${params}`;
}

/** Build a Booking.com hotel search link for a city stay. */
export function buildHotelLink(
  city: CityStop & { arrivalDate: string; departureDate: string },
  travelers: number
): string {
  const params = new URLSearchParams({
    ss: city.city,
    checkin: city.arrivalDate,
    checkout: city.departureDate,
    group_adults: String(travelers),
    aid: AFFILIATE_IDS.booking,
    no_rooms: "1",
    selected_currency: "EUR",
  });
  return `https://www.booking.com/searchresults.html?${params}`;
}

/** Build a GetYourGuide activity search link. */
function buildActivityLink(city: string, activity: string): string {
  const params = new URLSearchParams({
    q: `${city} ${activity}`,
    partner_id: AFFILIATE_IDS.getyourguide,
  });
  return `https://www.getyourguide.com/s/?${params}`;
}

/**
 * Wrap any affiliate URL in the internal redirect endpoint for click tracking.
 * All affiliate links in the app should go through this.
 */
export function buildTrackedLink(p: {
  provider: "skyscanner" | "booking" | "getyourguide";
  type: "flight" | "hotel" | "activity";
  itineraryId?: string;
  city?: string;
  dest: string;
}): string {
  const query = new URLSearchParams({
    provider: p.provider,
    type: p.type,
    dest: p.dest,
    ...(p.itineraryId && { itinerary_id: p.itineraryId }),
    ...(p.city && { city: p.city }),
  });
  return `/api/v1/affiliate/redirect?${query}`;
}

/** Parse IATA code from a label like "LEJ – Leipzig/Halle" */
export function parseIataCode(airportLabel: string): string {
  const match = airportLabel.match(/^([A-Z]{3})/);
  return match ? match[1] : airportLabel.slice(0, 3).toUpperCase();
}
