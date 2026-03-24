// ============================================================
// Travel Pro — Flight Optimization Types
// ============================================================

/** City returned by the Haiku route-selector with flexible day range */
export interface CityWithDays {
  id: string; // slug-safe id (e.g. "tokyo")
  city: string;
  country: string;
  countryCode: string; // ISO 2-letter code (JP, VN, TH)
  iataCode: string; // main international airport IATA code (e.g. "NRT")
  lat: number;
  lng: number;
  minDays: number;
  maxDays: number;
}

/** Cheapest flight option for a single leg */
export interface FlightOption {
  price: number; // EUR, total for all travelers
  duration: string; // human-readable, e.g. "12h 30m"
  airline: string; // IATA carrier code, e.g. "LH"
  departureTime?: string; // ISO 8601 or local time string
  arrivalTime?: string; // ISO 8601 or local time string
  stops?: number; // 0 = nonstop
}

/** A resolved flight leg with optimized date and real price */
export interface OptimizedLeg {
  fromCity: string;
  toCity: string;
  fromIata: string;
  toIata: string;
  departureDate: string; // YYYY-MM-DD
  price: number; // EUR, total for all travelers
  duration: string; // e.g. "12h 30m"
  airline: string;
  departureTime?: string; // local time string, e.g. "08:30"
  arrivalTime?: string; // local time string
  stops?: number; // 0 = nonstop
}

/** A single flight search result with booking details */
export interface FlightSearchResult {
  price: number; // EUR total
  duration: string; // "12h 30m"
  airline: string; // IATA carrier code
  stops: number; // 0 = nonstop
  departureTime: string; // ISO 8601
  arrivalTime: string; // ISO 8601
  cabin: string; // "ECONOMY" etc.
  bookingUrl: string; // Skyscanner affiliate fallback link
  bookingToken?: string; // SerpApi booking_token for resolving direct booking URL
}

/** Multiple flight results for a single leg */
export interface FlightLegResults {
  fromIata: string;
  toIata: string;
  departureDate: string;
  results: FlightSearchResult[]; // up to 10, price-sorted
  fetchedAt: number; // epoch ms
}

/**
 * A price-lookup function injected into the optimizer.
 * Decouples the DP algorithm from SerpApi and env-checking.
 */
export type FlightSearcher = (
  origin: string,
  destination: string,
  date: string,
  travelers: number,
  signal?: AbortSignal
) => Promise<FlightOption | null>;

/** Complete optimized flight skeleton for the whole trip */
export interface FlightSkeleton {
  homeIata: string;
  legs: OptimizedLeg[]; // outbound + inter-city + return
  totalFlightCost: number; // sum of all leg prices in EUR
  dayAssignment: number[]; // days per city (same order as cities input)
  /** Average cost across all valid date assignments; absent when only one assignment exists */
  baselineCost?: number;
}
