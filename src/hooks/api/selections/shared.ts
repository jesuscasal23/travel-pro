"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client/api-fetch";

interface SelectionQueryOptions {
  enabled?: boolean;
}

interface SelectionQueryDefinition<TSelection> {
  kind: "flights" | "hotels";
  queryKey: (tripId: string) => readonly unknown[];
  source: string;
  fallbackMessage: string;
}

export function createSelectionQueryHook<TSelection>({
  kind,
  queryKey,
  source,
  fallbackMessage,
}: SelectionQueryDefinition<TSelection>) {
  return function useSelectionQuery(tripId: string, options?: SelectionQueryOptions) {
    return useQuery({
      queryKey: queryKey(tripId),
      queryFn: async () => {
        const res = await apiFetch<{ selections: TSelection[] }>(
          `/api/v1/trips/${tripId}/selections/${kind}`,
          { source, fallbackMessage }
        );
        return res.selections;
      },
      enabled: options?.enabled ?? true,
    });
  };
}
