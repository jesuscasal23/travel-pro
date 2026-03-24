// ============================================================
// Travel Pro — IATA Code Utilities
//
// Consolidated home for all IATA resolution logic:
// - parseIataCode: extract IATA from airport labels
// - lookupIata: city name → IATA code (re-export)
// ============================================================

export { lookupIata } from "./city-iata-map";

/** Parse IATA code from an airport label like "LEJ – Leipzig/Halle" → "LEJ" */
export function parseIataCode(airportLabel: string): string {
  const match = airportLabel.match(/^([A-Z]{3})/);
  return match ? match[1] : airportLabel.slice(0, 3).toUpperCase();
}
