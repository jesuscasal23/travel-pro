// ============================================================
// Fichi — IATA Code Utilities
//
// Consolidated home for all IATA resolution logic:
// - parseIataCode: extract IATA from airport labels
// ============================================================

/** Parse IATA code from an airport label like "LEJ – Leipzig/Halle" → "LEJ" */
export function parseIataCode(airportLabel: string): string {
  const match = airportLabel.match(/^([A-Z]{3})/);
  return match ? match[1] : airportLabel.slice(0, 3).toUpperCase();
}
