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

/** Budget breakdown */
export interface TripBudget {
  flights: number;
  accommodation: number;
  activities: number;
  food: number;
  transport: number;
  total: number;
  budget: number;
}

/** Visa info for a country */
export interface VisaInfo {
  country: string;
  countryCode: string;
  requirement: "visa-free" | "e-visa" | "visa-required";
  maxStayDays: number;
  processingDays?: number;
  notes: string;
  icon: string; // emoji
  label: string;
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

/** Airport option */
export interface Airport {
  code: string;
  name: string;
  label: string;
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

/** Trip vibe */
export type TripVibe = "relaxation" | "adventure" | "cultural" | "mix";

/** Full itinerary result from AI pipeline */
export interface Itinerary {
  route: CityStop[];
  days: TripDay[];
  budget: TripBudget;
  visaData: VisaInfo[];
  weatherData: CityWeather[];
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
  region: string;
  dateStart: string;
  dateEnd: string;
  flexibleDates: boolean;
  budget: number;
  vibe: TripVibe;
  travelers: number;
}
