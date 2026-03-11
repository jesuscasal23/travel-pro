"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { FlightSearchResult, FlightLegResults } from "@/lib/flights/types";

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
  const controllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (
      fromIata: string,
      toIata: string,
      departureDate: string,
      travelers: number,
      filters?: { nonStop?: boolean; maxPrice?: number }
    ) => {
      // Abort any in-flight request
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const res = await fetch(`/api/v1/trips/${tripId}/flights`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromIata, toIata, departureDate, travelers, ...filters }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Search failed (${res.status})`);
        }

        const data = (await res.json()) as {
          results: FlightSearchResult[];
          fetchedAt: number;
        };

        if (!controller.signal.aborted) {
          setState({
            results: data.results,
            loading: false,
            error: null,
            fetchedAt: data.fetchedAt,
          });
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : "Search failed",
          }));
        }
      }
    },
    [tripId]
  );

  // Abort on unmount
  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  return { ...state, search };
}

// ── Batch flight search ─────────────────────────────────────────
// Fetches all legs in parallel on mount, returns per-leg results map.

function legKey(fromIata: string, toIata: string, date: string): string {
  return `${fromIata}-${toIata}-${date}`;
}

interface BatchState {
  resultsByLeg: Record<string, FlightSearchResult[]>;
  errorsByLeg: Record<string, string>;
  pendingCount: number;
  fetchedAt: number | null;
}

export function useBatchFlightSearch(
  tripId: string,
  legs: FlightLegResults[],
  travelers: number,
  enabled: boolean
) {
  const [state, setState] = useState<BatchState>({
    resultsByLeg: {},
    errorsByLeg: {},
    pendingCount: 0,
    fetchedAt: null,
  });
  const [started, setStarted] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || started || legs.length === 0 || travelers < 1) return;

    const toFetch = legs.filter((l) => l.results.length === 0 && l.departureDate);
    if (toFetch.length === 0) return;

    const controller = new AbortController();
    controllerRef.current = controller;

    setStarted(true);
    setState((s) => ({ ...s, pendingCount: toFetch.length }));

    for (const leg of toFetch) {
      const key = legKey(leg.fromIata, leg.toIata, leg.departureDate);

      fetch(`/api/v1/trips/${tripId}/flights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromIata: leg.fromIata,
          toIata: leg.toIata,
          departureDate: leg.departureDate,
          travelers,
        }),
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body as { error?: string }).error ?? `Search failed (${res.status})`);
          }
          const data = (await res.json()) as {
            results: FlightSearchResult[];
            fetchedAt: number;
          };
          if (!controller.signal.aborted) {
            setState((s) => ({
              ...s,
              resultsByLeg: { ...s.resultsByLeg, [key]: data.results },
              pendingCount: s.pendingCount - 1,
              fetchedAt: data.fetchedAt,
            }));
          }
        })
        .catch((e) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          if (!controller.signal.aborted) {
            setState((s) => ({
              ...s,
              errorsByLeg: {
                ...s.errorsByLeg,
                [key]: e instanceof Error ? e.message : "Search failed",
              },
              pendingCount: s.pendingCount - 1,
            }));
          }
        });
    }

    // Abort all in-flight requests on cleanup
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, started]);

  const getResultsForLeg = useCallback(
    (fromIata: string, toIata: string, date: string) => {
      const key = legKey(fromIata, toIata, date);
      const hasResult = key in state.resultsByLeg;
      const hasError = key in state.errorsByLeg;
      return {
        results: state.resultsByLeg[key] ?? [],
        loading: started && !hasResult && !hasError,
        error: state.errorsByLeg[key] ?? null,
        fetchedAt: hasResult ? state.fetchedAt : null,
      };
    },
    [state, started]
  );

  return { getResultsForLeg, isLoading: state.pendingCount > 0 };
}
