"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";

interface UpsertSelectionParams {
  tripId: string;
  body: Record<string, unknown>;
}

type SelectionWithId = { id: string };

export function useUpsertSelection<T extends SelectionWithId>(
  kind: "flights" | "hotels",
  forTrip: (tripId: string) => readonly unknown[]
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, body }: UpsertSelectionParams) => {
      return apiFetch<{ selection: T }>(`/api/v1/trips/${tripId}/selections/${kind}`, {
        source: `useUpsert${kind.charAt(0).toUpperCase() + kind.slice(1)}Selection`,
        method: "PUT",
        body,
        fallbackMessage: `Failed to save ${kind.slice(0, -1)} selection`,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<T[]>(forTrip(variables.tripId), (old) => {
        if (!old) return [data.selection];
        const idx = old.findIndex((s) => s.id === data.selection.id);
        if (idx >= 0) return old.map((s, i) => (i === idx ? data.selection : s));
        return [...old, data.selection];
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.unbookedCount() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.selections.cart() });
    },
  });
}
