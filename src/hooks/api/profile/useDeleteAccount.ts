import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiFetch<Record<string, unknown>>("/api/v1/profile", {
        source: "useDeleteAccount",
        method: "DELETE",
        fallbackMessage: "Failed to delete account",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.profile.detail(), null);
      queryClient.removeQueries({ queryKey: queryKeys.trips.all });
    },
  });
}
