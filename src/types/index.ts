// ============================================================
// Fichi — Core Type Definitions
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
  price: number; // EUR, total for all travelers
  duration: string; // e.g. "12h 30m"
  airline: string;
  departureTime?: string; // local time string, e.g. "08:30"
  arrivalTime?: string; // local time string
  stops?: number; // 0 = nonstop
}

/** A single activity within a day */
export interface DayActivity {
  name: string;
  category: string;
  icon?: string; // legacy — now derived from category client-side
  why: string;
  duration: string;
  tip?: string;
  food?: string;
  cost?: string; // estimated cost range, e.g. "€10-15"
}

/** A swipe card candidate generated during activity discovery. */
export interface ActivityDiscoveryCandidate {
  name: string;
  placeName: string | null;
  description: string;
  category: string;
  duration: string;
  googleMapsUrl: string;
  imageUrl: string | null;
}

/** A persisted discovered activity row (includes DB id and swipe state). */
export interface DiscoveredActivityRow extends ActivityDiscoveryCandidate {
  id: string;
  cityId: string;
  city: string;
  decision: "liked" | "disliked" | null;
  decidedAt: string | null;
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
  requirement:
    | "visa-free"
    | "visa-on-arrival"
    | "e-visa"
    | "eta"
    | "visa-required"
    | "no-admission";
  maxStayDays: number;
  notes: string;
  icon: string; // emoji
  label: string;
  sourceUrl: string; // official government immigration URL
  sourceLabel: string; // human-readable label for the source link
}

/** A hotel recommendation for a city */
export interface CityHotel {
  hotelId: string;
  name: string;
  city: string;
  rating?: number; // star rating (1-5)
  overallRating?: number; // guest review score (e.g. 4.2/5)
  reviewCount?: number; // number of guest reviews
  pricePerNight?: number;
  totalPrice?: number;
  currency: string;
  address?: string;
  distance?: string; // distance from city center
  imageUrl?: string; // thumbnail from SerpApi Google Hotels
  bookingUrl: string;
  why: string; // AI-generated reason
}

/** Accommodation data for a city stop */
export interface CityAccommodation {
  city: string;
  countryCode: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  hotels: CityHotel[];
  fallbackSearchUrl: string;
}

/** Weather data for a city */
export interface CityWeather {
  city: string;
  temp: string;
  condition: string;
  icon: string; // emoji
}

/** Trip summary returned by GET /api/v1/trips (dashboard list) */
export interface TripSummary {
  id: string;
  region: string;
  tripType?: TripType;
  destination?: string;
  destinationCountry?: string;
  destinationCountryCode?: string;
  dateStart: string;
  dateEnd: string;
  travelers: number;
  createdAt: string;
  itineraries: { id: string; buildStatus: string; discoveryStatus?: DiscoveryStatus }[];
}

/** Region option for questionnaire */
interface Region {
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
export type TravelStyle = "backpacker" | "smart-budget" | "comfort-explorer" | "luxury";

/** Activity discovery lifecycle for a trip itinerary. */
export type DiscoveryStatus = "pending" | "in_progress" | "completed";

/** Activity pace — how many activities per day the traveler prefers */
export type ActivityPace = "relaxed" | "moderate" | "active";

/** Vibe slider keys from onboarding — each value is 0-100 */
export type VibeKey =
  | "adventureComfort"
  | "socialQuiet"
  | "luxuryBudget"
  | "structuredSpontaneous"
  | "warmMixed";

/** Vibe scores collected during onboarding (all values 0–100) */
export type VibeScores = Record<VibeKey, number>;

/** Trip type — single-city (one destination) or multi-city (multiple explicit cities) */
export type TripType = "single-city" | "multi-city";

/** Full itinerary — route skeleton built from user-provided cities, enriched with activities, flights, visa, and weather */
export interface Itinerary {
  route: CityStop[];
  days: TripDay[];
  /** Populated by background enrichment after core itinerary is ready */
  visaData?: VisaInfo[];
  /** Populated by background enrichment after core itinerary is ready */
  weatherData?: CityWeather[];
  /** Hotel accommodation data populated by background enrichment */
  accommodationData?: CityAccommodation[];
  /** Real flight legs populated when flight optimization succeeds */
  flightLegs?: ItineraryFlightLeg[];
  /** Pre-fetched multi-result flight options per leg (up to 5 results each) */
  flightOptions?: import("@/lib/flights/types").FlightLegResults[];
}

/** Profile data collected during onboarding */
export interface UserProfile {
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];
  pace?: ActivityPace;
  vibes?: VibeScores;
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
  description?: string;
}

/** Metadata stored with a booking click for later identification */
/** Direction of a flight leg relative to the trip route */
export type FlightDirection = "outbound" | "return" | "internal";

export type BookingClickMetadata =
  | {
      type: "flight";
      fromIata: string;
      toIata: string;
      departureDate: string;
      direction?: FlightDirection;
      airline?: string;
      price?: number;
    }
  | {
      type: "hotel";
      hotelName?: string;
      hotelId?: string;
      city?: string;
      checkIn?: string;
      checkOut?: string;
      pricePerNight?: number;
    };

/** A booking click record returned by the API */
export interface BookingClick {
  id: string;
  tripId: string | null;
  provider: string;
  clickType: string;
  city: string | null;
  metadata: BookingClickMetadata | null;
  bookingConfirmed: boolean | null;
  createdAt: string;
}

// ============================================================
// Selections — flight & hotel picks for shopping cart
// ============================================================

export type SelectionType = "platform" | "manual";

export interface FlightSelection {
  id: string;
  tripId: string;
  profileId: string;
  selectionType: SelectionType;
  fromIata: string;
  toIata: string;
  departureDate: string;
  direction: FlightDirection;
  airline: string;
  price: number;
  duration: string;
  stops: number;
  departureTime: string | null;
  arrivalTime: string | null;
  cabin: string;
  bookingToken: string | null;
  bookingUrl: string;
  booked: boolean;
  bookedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HotelSelection {
  id: string;
  tripId: string;
  profileId: string;
  selectionType: SelectionType;
  city: string;
  countryCode: string;
  checkIn: string;
  checkOut: string;
  hotelName: string;
  hotelId: string;
  rating: number | null;
  pricePerNight: number | null;
  totalPrice: number | null;
  currency: string;
  address: string | null;
  imageUrl: string | null;
  bookingUrl: string;
  booked: boolean;
  bookedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartTrip {
  tripId: string;
  dateStart: string;
  dateEnd: string;
  destination: string | null;
  region: string;
  flights: FlightSelection[];
  hotels: HotelSelection[];
}
