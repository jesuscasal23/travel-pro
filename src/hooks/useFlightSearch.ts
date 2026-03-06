"use client";

import { useState, useCallback } from "react";
import type { FlightSearchResult } from "@/lib/flights/types";

interface FlightSearchState {
  results: FlightSearchResult[];
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
}

export function useFlightSearch(tripId: string) {
  const [state, setState] = useState<FlightSearchState>({
    results: [],
    loading: false,
    error: null,
    fetchedAt: null,
  });

  const search = useCallback(
    async (fromIata: string, toIata: string, departureDate: string, travelers: number) => {
      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const res = await fetch(`/api/v1/trips/${tripId}/flights`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromIata, toIata, departureDate, travelers }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Search failed (${res.status})`);
        }

        const data = (await res.json()) as {
          results: FlightSearchResult[];
          fetchedAt: number;
        };

        setState({
          results: data.results,
          loading: false,
          error: null,
          fetchedAt: data.fetchedAt,
        });
      } catch (e) {
        setState((s) => ({
          ...s,
          loading: false,
          error: e instanceof Error ? e.message : "Search failed",
        }));
      }
    },
    [tripId]
  );

  return { ...state, search };
}
