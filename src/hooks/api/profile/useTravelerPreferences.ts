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

  // Use individual primitive selectors to avoid creating a new object on every
  // render — object selectors without useShallow violate useSyncExternalStore's
  // getSnapshot stability requirement and trigger an infinite render loop.
  const nationality = useTripStore((s) => s.nationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const travelStyle = useTripStore((s) => s.travelStyle);
  const interests = useTripStore((s) => s.interests);
  const pace = useTripStore((s) => s.pace);

  const profileQuery = useProfile({
    enabled: (options?.enabled ?? true) && isAuthenticated === true,
  });

  const data = useMemo<TravelerPreferences | null>(() => {
    if (profileQuery.data) {
      return toTravelerPreferences(profileQuery.data);
    }

    if (options?.includeTransientFallback) {
      return toTravelerPreferences({ nationality, homeAirport, travelStyle, interests, pace });
    }

    return null;
  }, [
    options?.includeTransientFallback,
    profileQuery.data,
    nationality,
    homeAirport,
    travelStyle,
    interests,
    pace,
  ]);

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
