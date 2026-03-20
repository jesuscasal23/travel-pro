import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { useTripStore } from "@/stores/useTripStore";
import { apiFetch } from "@/lib/client/api-fetch";
import type { Itinerary } from "@/types";

interface SaveEditParams {
  tripId: string;
  editType: string;
  editPayload: object;
  description: string;
  data: Itinerary;
}

export function useSaveTripEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, ...body }: SaveEditParams) => {
      return apiFetch(`/api/v1/trips/${tripId}`, {
        source: "useSaveTripEdit",
        method: "PATCH",
        body,
        fallbackMessage: "Save failed",
      });
    },
    onMutate: () => {
      return { previousItinerary: useTripStore.getState().itinerary };
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(
        queryKeys.trips.detail(variables.tripId),
        (
          previous:
            | {
                itineraries?: Array<Record<string, unknown>>;
              }
            | null
            | undefined
        ) => {
          if (!previous?.itineraries?.length) return previous;
          const [first, ...rest] = previous.itineraries;
          return {
            ...previous,
            itineraries: [{ ...first, data: variables.data }, ...rest],
          };
        }
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(variables.tripId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
    meta: {
      errorToast: "Your trip edits couldn't be saved. They may be lost on refresh.",
    },
  });
}
