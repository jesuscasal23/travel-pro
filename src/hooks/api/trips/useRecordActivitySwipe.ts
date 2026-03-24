import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { ActivityDiscoveryCandidate } from "@/types";

interface RecordActivitySwipeParams {
  tripId: string;
  destination: string;
  decision: "liked" | "disliked";
  activity: ActivityDiscoveryCandidate;
  isFinal?: boolean;
}

interface RecordActivitySwipeResponse {
  discoveryStatus: "in_progress" | "completed";
}

export function useRecordActivitySwipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      destination,
      decision,
      activity,
      isFinal,
    }: RecordActivitySwipeParams): Promise<RecordActivitySwipeResponse> => {
      return apiFetch<RecordActivitySwipeResponse>(`/api/v1/trips/${tripId}/activity-swipes`, {
        source: "useRecordActivitySwipe",
        method: "POST",
        body: {
          destination,
          decision,
          activity,
          isFinal,
        },
        fallbackMessage: "Failed to save swipe decision",
      });
    },
    onSuccess: (_data, variables) => {
      if (variables.isFinal) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(variables.tripId) });
      }
    },
  });
}
