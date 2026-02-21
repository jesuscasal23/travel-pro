// ============================================================
// Travel Pro — Core Type Definitions
// ============================================================

/** A city stop on the route */
export interface CityStop {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  days: number;
  countryCode: string;
  iataCode?: string; // main international airport (populated when flight optimization runs)
}

/** A real flight leg stored in the itinerary after price optimization */
export interface ItineraryFlightLeg {
  fromCity: string;
  toCity: string;
  fromIata: string;
  toIata: string;
  departureDate: string; // YYYY-MM-DD
  price: number;         // EUR, total for all travelers
  duration: string;      // e.g. "12h 30m"
  airline: string;
}

/** A single activity within a day */
export interface DayActivity {
  name: string;
  category: string;
  icon: string; // emoji
  why: string;
  duration: string;
  tip?: string;
  food?: string;
  cost?: string;
}

/** A single day in the itinerary */
export interface TripDay {
  day: number;
  date: string;
  city: string;
  activities: DayActivity[];
  isTravel?: boolean;
  travelFrom?: string;
  travelTo?: string;
  travelDuration?: string;
}


/** Visa info for a country */
export interface VisaInfo {
  country: string;
  countryCode: string;
  requirement: "visa-free" | "visa-on-arrival" | "e-visa" | "eta" | "visa-required" | "no-admission";
  maxStayDays: number;
  processingDays?: number;
  notes: string;
  icon: string; // emoji
  label: string;
  sourceUrl: string;    // official government immigration URL
  sourceLabel: string;  // human-readable label for the source link
}

/** Weather data for a city */
export interface CityWeather {
  city: string;
  temp: string;
  condition: string;
  icon: string; // emoji
}

/** A saved trip on the dashboard */
export interface SavedTrip {
  id: string;
  name: string;
  countries: number;
  dates: string;
  status: "Planning" | "Ready" | "Completed";
}

/** Trip summary returned by GET /api/v1/trips (dashboard list) */
export interface TripSummary {
  id: string;
  region: string;
  tripType?: TripType;
  destination?: string;
  destinationCountry?: string;
  dateStart: string;
  dateEnd: string;
  travelers: number;
  createdAt: string;
  itineraries: { id: string; generationStatus: string }[];
}


/** Region option for questionnaire */
export interface Region {
  id: string;
  name: string;
  countries: string;
  popular?: boolean;
}

/** Interest chip option */
export interface InterestOption {
  id: string;
  label: string;
  emoji: string;
}

/** Travel style */
export type TravelStyle = "backpacker" | "comfort" | "luxury";

/** Trip type — single-city (one destination) or multi-city (region-based route) */
export type TripType = "single-city" | "single-country" | "multi-city";

/** Full itinerary result from AI pipeline */
export interface Itinerary {
  route: CityStop[];
  days: TripDay[];
  /** Populated by background enrichment after core itinerary is ready */
  visaData?: VisaInfo[];
  /** Populated by background enrichment after core itinerary is ready */
  weatherData?: CityWeather[];
  /** Real flight legs populated when Amadeus optimization succeeds */
  flightLegs?: ItineraryFlightLeg[];
  /** Average cost across all evaluated date combinations — used to show savings vs optimized cost */
  flightBaselineCost?: number;
}

/** Profile data collected during onboarding */
export interface UserProfile {
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];
}

/** Trip planning intent from questionnaire */
export interface TripIntent {
  id: string;
  tripType?: TripType;
  region: string;
  /** Single-city destination fields */
  destination?: string;
  destinationCountry?: string;
  destinationCountryCode?: string;
  destinationLat?: number;
  destinationLng?: number;
  dateStart: string;
  dateEnd: string;
  travelers: number;
}
