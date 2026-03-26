import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { updateTripDetailCache } from "@/hooks/api/trips/shared";
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
    onMutate: async ({ tripId }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic rollback
      await queryClient.cancelQueries({ queryKey: queryKeys.trips.detail(tripId) });
      // Snapshot the current React Query cache entry for rollback on error
      const previousTrip = queryClient.getQueryData(queryKeys.trips.detail(tripId));
      return { previousTrip, tripId };
    },
    onError: (_err, _vars, context) => {
      // Restore the React Query cache to the pre-mutation snapshot
      if (context?.previousTrip) {
        queryClient.setQueryData(queryKeys.trips.detail(context.tripId), context.previousTrip);
      }
    },
    onSuccess: (_data, variables) => {
      updateTripDetailCache(queryClient, variables.tripId, variables.data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(variables.tripId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
    meta: {
      errorToast: "Your trip edits couldn't be saved. They may be lost on refresh.",
    },
  });
}
