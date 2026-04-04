import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client/api-fetch";
import type { DiscoveredActivityRow, UserProfile } from "@/types";

interface DiscoverActivitiesParams {
  tripId: string;
  cityId: string;
  profile?: UserProfile;
  excludeNames?: string[];
}

interface DiscoverActivitiesResponse {
  activities: DiscoveredActivityRow[];
  roundLimitReached: boolean;
  reachability: {
    filtered: number;
    verifiedFiltered: number;
    autoRegenerated: boolean;
  };
}

export function useDiscoverActivities() {
  return useMutation({
    retry: false,
    mutationFn: async ({
      tripId,
      cityId,
      profile,
      excludeNames,
    }: DiscoverActivitiesParams): Promise<DiscoverActivitiesResponse> => {
      const data = await apiFetch<DiscoverActivitiesResponse>(
        `/api/v1/trips/${tripId}/discover-activities`,
        {
          source: "useDiscoverActivities",
          method: "POST",
          body: {
            cityId,
            ...(profile ? { profile } : {}),
            ...(excludeNames?.length ? { excludeNames } : {}),
          },
          fallbackMessage: "Activity discovery failed",
        }
      );

      return {
        activities: data.activities ?? [],
        roundLimitReached: data.roundLimitReached ?? false,
        reachability: data.reachability ?? {
          filtered: 0,
          verifiedFiltered: 0,
          autoRegenerated: false,
        },
      };
    },
  });
}
