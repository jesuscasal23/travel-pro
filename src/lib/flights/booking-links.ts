// ============================================================
// Travel Pro — Flight Booking Link Builder
//
// Builds Skyscanner deep links for flight searches.
// Moved from affiliate/link-generator.ts to eliminate the
// reverse dependency (serpapi.ts → affiliate).
// ============================================================

const SKYSCANNER_AFFILIATE_ID = "travel-pro";

interface FlightLeg {
  fromIata: string;
  toIata: string;
  departureDate: string; // YYYY-MM-DD
}

/** Build a Skyscanner deep link for a flight leg. */
export function buildFlightLink(leg: FlightLeg, travelers: number): string {
  const date = leg.departureDate.replace(/-/g, "").slice(2); // YYMMDD
  const params = new URLSearchParams({ adults: String(travelers), ref: SKYSCANNER_AFFILIATE_ID });
  return `https://www.skyscanner.net/transport/flights/${leg.fromIata}/${leg.toIata}/${date}/?${params}`;
}
