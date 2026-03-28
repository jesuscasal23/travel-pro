import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      return apiFetch<Record<string, unknown>>(`/api/v1/trips/${tripId}`, {
        source: "useDeleteTrip",
        method: "DELETE",
        fallbackMessage: "Failed to delete trip.",
      });
    },
    onSuccess: (_data, tripId) => {
      // Remove the specific trip's cached detail to prevent stale renders
      queryClient.removeQueries({ queryKey: queryKeys.trips.detail(tripId) });
      // Invalidate all trip-related queries and dependent caches
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.cart() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.unbookedCount() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookingClicks.forTrip(tripId) });
    },
  });
}
