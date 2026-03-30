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
}

export function useDiscoverActivities() {
  return useMutation({
    mutationFn: async ({
      tripId,
      cityId,
      profile,
      excludeNames,
    }: DiscoverActivitiesParams): Promise<DiscoveredActivityRow[]> => {
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

      return data.activities ?? [];
    },
  });
}
