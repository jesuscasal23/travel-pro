import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";

interface RecordActivitySwipeParams {
  tripId: string;
  activityId: string;
  decision: "liked" | "disliked";
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
      activityId,
      decision,
      isFinal,
    }: RecordActivitySwipeParams): Promise<RecordActivitySwipeResponse> => {
      return apiFetch<RecordActivitySwipeResponse>(`/api/v1/trips/${tripId}/activity-swipes`, {
        source: "useRecordActivitySwipe",
        method: "POST",
        body: {
          activityId,
          decision,
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
