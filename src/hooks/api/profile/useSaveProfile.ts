import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import { shouldRetryQuery } from "@/lib/client/query-retry";
import type { ProfileData, PersistedProfile } from "./shared";

export function useSaveProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileData) => {
      return apiFetch<{ profile?: PersistedProfile }>("/api/v1/profile", {
        source: "useSaveProfile",
        method: "PATCH",
        body: data,
        fallbackMessage: "Failed to save profile",
      });
    },
    retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
    retryDelay: (attempt) => Math.min(300 * 2 ** attempt, 2000),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.detail(), data.profile ?? null);
    },
  });
}
