// ============================================================
// Travel Pro — Affiliate Link Generator
// Builds tracked deep links for Booking.com, GetYourGuide
//
// Flight links (Skyscanner) have moved to @/lib/flights/booking-links.
// IATA parsing has moved to @/lib/flights/iata.
// ============================================================

import type { CityStop } from "@/types";

const AFFILIATE_IDS = {
  booking: process.env.BOOKING_AFFILIATE_ID ?? "TRAVEL_PRO_AID",
  getyourguide: process.env.GYG_PARTNER_ID ?? "TRAVEL_PRO_ID",
} as const;

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
  metadata?: Record<string, unknown>;
}): string {
  const query = new URLSearchParams({
    provider: p.provider,
    type: p.type,
    dest: p.dest,
    ...(p.itineraryId && { itinerary_id: p.itineraryId }),
    ...(p.city && { city: p.city }),
    ...(p.metadata && { metadata: JSON.stringify(p.metadata) }),
  });
  return `/api/v1/affiliate/redirect?${query}`;
}
