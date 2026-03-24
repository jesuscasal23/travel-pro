"use client";

import { useMemo } from "react";
import { useTripStore } from "@/stores/useTripStore";
import { useAuthStatus } from "@/hooks/api/auth/useAuthStatus";
import {
  toTravelerPreferences,
  type TravelerPreferences,
} from "@/lib/features/profile/traveler-preferences";
import { useProfile } from "./useProfile";

interface UseTravelerPreferencesOptions {
  enabled?: boolean;
  includeTransientFallback?: boolean;
}

type TravelerPreferencesSource = "server" | "transient" | null;

export function useTravelerPreferences(options?: UseTravelerPreferencesOptions) {
  const isAuthenticated = useAuthStatus();
  const transientPreferences = useTripStore((state) => ({
    nationality: state.nationality,
    homeAirport: state.homeAirport,
    travelStyle: state.travelStyle,
    interests: state.interests,
    pace: state.pace,
  }));

  const profileQuery = useProfile({
    enabled: (options?.enabled ?? true) && isAuthenticated === true,
  });

  const data = useMemo<TravelerPreferences | null>(() => {
    if (profileQuery.data) {
      return toTravelerPreferences(profileQuery.data);
    }

    if (options?.includeTransientFallback) {
      return toTravelerPreferences(transientPreferences);
    }

    return null;
  }, [options?.includeTransientFallback, profileQuery.data, transientPreferences]);

  const source: TravelerPreferencesSource = profileQuery.data
    ? "server"
    : options?.includeTransientFallback
      ? "transient"
      : null;

  return {
    ...profileQuery,
    data,
    source,
    isAuthenticated,
    hasServerProfile: Boolean(profileQuery.data),
  };
}
