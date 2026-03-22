import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";

export function useDeleteAdminTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      return apiFetch<Record<string, unknown>>(`/api/v1/admin/trips/${tripId}`, {
        source: "useDeleteAdminTrip",
        method: "DELETE",
        fallbackMessage: "Failed to delete trip.",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.trips.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() });
    },
  });
}
