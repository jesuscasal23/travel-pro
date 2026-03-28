import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { PersistedProfile } from "./shared";

export function useMarkChangelogSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (version: string) => {
      return apiFetch<{ profile?: PersistedProfile }>("/api/v1/profile", {
        source: "useMarkChangelogSeen",
        method: "PATCH",
        body: { lastSeenAppVersion: version },
        fallbackMessage: "Failed to update changelog status",
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.detail(), data.profile ?? null);
    },
  });
}
