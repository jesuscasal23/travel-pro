import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { CityProgress } from "@/types";

interface RecordActivitySwipeParams {
  tripId: string;
  activityId: string;
  decision: "liked" | "disliked";
  cityId: string;
}

export interface RecordActivitySwipeResponse {
  ok: true;
  cityProgress: CityProgress;
  batchComplete: boolean;
  nextCityId: string | null;
  allCitiesComplete: boolean;
}

export function useRecordActivitySwipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      activityId,
      decision,
      cityId,
    }: RecordActivitySwipeParams): Promise<RecordActivitySwipeResponse> => {
      return apiFetch<RecordActivitySwipeResponse>(`/api/v1/trips/${tripId}/activity-swipes`, {
        source: "useRecordActivitySwipe",
        method: "POST",
        body: {
          activityId,
          decision,
          cityId,
        },
        fallbackMessage: "Failed to save swipe decision",
      });
    },
    onSuccess: (data, variables) => {
      if (data.allCitiesComplete) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(variables.tripId) });
      }
    },
  });
}
