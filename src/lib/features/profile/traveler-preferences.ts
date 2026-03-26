import type { ActivityPace, TravelStyle, UserProfile } from "@/types";
import { normalizeInterest, normalizeInterests } from "./interests";
import { resolvePaceInput } from "./pace";

export interface TravelerPreferences extends Omit<UserProfile, "pace"> {
  pace: ActivityPace;
  onboardingCompleted: boolean;
  languagesSpoken: string[];
}

type TravelerPreferencesInput = Partial<TravelerPreferences> & {
  activityLevel?: string | null;
  nationality?: string | null;
  homeAirport?: string | null;
  travelStyle?: TravelStyle | null;
  interests?: string[] | null;
  pace?: ActivityPace | null;
  languagesSpoken?: string[] | null;
};

export interface TravelerPreferencesPatch {
  nationality?: string;
  homeAirport?: string;
  travelStyle?: TravelStyle;
  interests?: string[];
  pace?: ActivityPace;
  onboardingCompleted?: boolean;
  languagesSpoken?: string[];
}

export const DEFAULT_TRAVELER_PREFERENCES: TravelerPreferences = {
  nationality: "",
  homeAirport: "",
  travelStyle: "smart-budget",
  interests: [],
  pace: "moderate",
  onboardingCompleted: false,
  languagesSpoken: [],
};

function asString(value: string | null | undefined): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => item.trim()).filter(Boolean);
}

export function toTravelerPreferences(
  input?: TravelerPreferencesInput | null
): TravelerPreferences {
  const pace = resolvePaceInput(input ?? {}) ?? DEFAULT_TRAVELER_PREFERENCES.pace;

  return {
    nationality: asString(input?.nationality),
    homeAirport: asString(input?.homeAirport),
    travelStyle: input?.travelStyle ?? DEFAULT_TRAVELER_PREFERENCES.travelStyle,
    interests: normalizeInterests(input?.interests),
    pace,
    onboardingCompleted:
      input?.onboardingCompleted ?? DEFAULT_TRAVELER_PREFERENCES.onboardingCompleted,
    languagesSpoken: asStringArray(input?.languagesSpoken),
  };
}

export function toggleTravelerPreferenceInterest(
  interests: readonly string[],
  rawInterest: string
): string[] {
  const normalized = normalizeInterest(rawInterest);
  if (!normalized) {
    return [...interests];
  }

  return interests.includes(normalized)
    ? interests.filter((interest) => interest !== normalized)
    : [...interests, normalized];
}

export function toTravelerProfile(preferences: TravelerPreferences): UserProfile {
  return {
    nationality: preferences.nationality,
    homeAirport: preferences.homeAirport,
    travelStyle: preferences.travelStyle,
    interests: preferences.interests,
    pace: preferences.pace,
  };
}

export function toTravelerPreferencesPatch(
  input: Partial<TravelerPreferences>
): TravelerPreferencesPatch {
  const patch: TravelerPreferencesPatch = {};

  if (input.nationality !== undefined) patch.nationality = input.nationality;
  if (input.homeAirport !== undefined) patch.homeAirport = input.homeAirport;
  if (input.travelStyle !== undefined) patch.travelStyle = input.travelStyle;
  if (input.interests !== undefined) patch.interests = normalizeInterests(input.interests);
  if (input.pace !== undefined) patch.pace = input.pace;
  if (input.onboardingCompleted !== undefined) {
    patch.onboardingCompleted = input.onboardingCompleted;
  }
  if (input.languagesSpoken !== undefined) {
    patch.languagesSpoken = asStringArray(input.languagesSpoken);
  }

  return patch;
}

export function extractHomeAirportIata(homeAirport: string): string {
  if (!homeAirport) return "";
  return homeAirport.split(/\s*[–—-]\s*/)[0].trim();
}
