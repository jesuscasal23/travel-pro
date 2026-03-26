import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client/api-fetch";
import type { ActivityDiscoveryCandidate, UserProfile } from "@/types";

interface DiscoverActivitiesParams {
  tripId: string;
  cityId: string;
  profile?: UserProfile;
}

interface DiscoverActivitiesResponse {
  activities: ActivityDiscoveryCandidate[];
}

export function useDiscoverActivities() {
  return useMutation({
    mutationFn: async ({
      tripId,
      cityId,
      profile,
    }: DiscoverActivitiesParams): Promise<ActivityDiscoveryCandidate[]> => {
      const data = await apiFetch<DiscoverActivitiesResponse>(
        `/api/v1/trips/${tripId}/discover-activities`,
        {
          source: "useDiscoverActivities",
          method: "POST",
          body: {
            cityId,
            ...(profile ? { profile } : {}),
          },
          fallbackMessage: "Activity discovery failed",
        }
      );

      return data.activities ?? [];
    },
  });
}
