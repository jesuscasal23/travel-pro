"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { CartTrip } from "@/types";

export function useCart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.selections.cart(),
    queryFn: async () => {
      const res = await apiFetch<{ trips: CartTrip[] }>("/api/v1/selections/cart", {
        source: "useCart",
        fallbackMessage: "Failed to load cart",
      });
      return res.trips;
    },
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: true,
  });
}
