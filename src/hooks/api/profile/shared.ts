import { apiFetch, ApiError } from "@/lib/client/api-fetch";
import type { ActivityPace, TravelStyle, UserProfile } from "@/types";

export interface ProfileData {
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];
  pace?: ActivityPace;
  onboardingCompleted?: boolean;
}

export interface PersistedProfile extends UserProfile {
  id: string;
  userId: string;
  isSuperUser?: boolean;
  onboardingCompleted?: boolean;
  languagesSpoken?: string[];
}

export async function fetchProfile(): Promise<PersistedProfile | null> {
  try {
    const data = await apiFetch<{ profile?: PersistedProfile }>("/api/v1/profile", {
      source: "useProfile",
      fallbackMessage: "Failed to load profile",
    });
    return data.profile ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
