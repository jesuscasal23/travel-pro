"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";

export function useUnbookedCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.selections.unbookedCount(),
    queryFn: async () => {
      const res = await apiFetch<{ count: number }>("/api/v1/selections/count", {
        source: "useUnbookedCount",
        fallbackMessage: "Failed to load cart count",
      });
      return res.count;
    },
    enabled: options?.enabled ?? true,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
