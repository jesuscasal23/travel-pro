// ============================================================
// V2 Type Definitions — extensions/replacements for v2 UI
// ============================================================

/** Travel preference spectrums (0-100 scale, left→right) */
export interface TravelPreferences {
  adventureComfort: number; // 0=Adventure, 100=Comfort
  socialQuiet: number; // 0=Social, 100=Quiet
  luxuryBudget: number; // 0=Luxury, 100=Budget
  structuredSpontaneous: number; // 0=Structured, 100=Spontaneous
  warmMixed: number; // 0=Warm Weather, 100=Mixed Climates
}

export type BudgetTier = "backpacker" | "smart-budget" | "comfort" | "luxury";
export type TravelPace = "fast" | "balanced" | "slow";

export interface V2UserProfile {
  preferences: TravelPreferences;
  interests: string[];
  budgetTier: BudgetTier;
  pace: TravelPace;
  painPoints: string[];
}

/** Home dashboard types */
export interface NextTripCard {
  id: string;
  title: string;
  daysAway: number;
  imageUrl: string;
  weather: { temp: number; condition: string };
  visaStatus: "ok" | "required" | "pending";
  flightStatus: "booked" | "found" | "searching";
  budgetStatus: "on-track" | "over" | "under";
}

export interface DepartureTask {
  id: string;
  title: string;
  subtitle: string;
  type: "packing" | "checkin" | "document" | "insurance";
}

export interface RiskScore {
  score: number; // 0-100
  label: string;
}

export interface EssentialsBundle {
  items: string[]; // e.g. ["eSIM", "Insurance"]
}
