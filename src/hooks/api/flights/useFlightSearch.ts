"use client";

import { useCallback } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { apiFetch } from "@/lib/client/api-fetch";
import type { FlightSearchResult, FlightLegResults } from "@/lib/flights/types";

interface FlightSearchRequest {
  fromIata: string;
  toIata: string;
  departureDate: string;
  travelers: number;
  nonStop?: boolean;
  maxPrice?: number;
}

interface FlightSearchResponse {
  results: FlightSearchResult[];
  fetchedAt: number;
}

async function fetchFlightSearch(
  tripId: string,
  request: FlightSearchRequest,
  signal?: AbortSignal
): Promise<FlightSearchResponse> {
  return apiFetch<FlightSearchResponse>(`/api/v1/trips/${tripId}/flights`, {
    source: "useFlightSearch",
    method: "POST",
    signal,
    body: request,
    fallbackMessage: "Search failed",
  });
}

export function useFlightSearch(tripId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (request: FlightSearchRequest) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.flights.trip(tripId) });

      return queryClient.fetchQuery({
        queryKey: queryKeys.flights.search(tripId, request),
        queryFn: ({ signal }) => fetchFlightSearch(tripId, request, signal),
        staleTime: 5 * 60 * 1000,
      });
    },
  });

  const search = useCallback(
    async (
      fromIata: string,
      toIata: string,
      departureDate: string,
      travelers: number,
      filters?: { nonStop?: boolean; maxPrice?: number }
    ) => {
      try {
        await mutation.mutateAsync({
          fromIata,
          toIata,
          departureDate,
          travelers,
          ...filters,
        });
      } catch {
        // Consumers read the exposed `error` state instead of handling thrown errors.
      }
    },
    [mutation]
  );

  return {
    results: mutation.data?.results ?? [],
    loading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    fetchedAt: mutation.data?.fetchedAt ?? null,
    search,
  };
}

export function useBatchFlightSearch(
  tripId: string,
  legs: FlightLegResults[],
  travelers: number,
  enabled: boolean
) {
  const queries = useQueries({
    queries: legs.map((leg) => {
      const request = {
        fromIata: leg.fromIata,
        toIata: leg.toIata,
        departureDate: leg.departureDate,
        travelers,
      };

      return {
        queryKey: queryKeys.flights.search(tripId, request),
        queryFn: ({ signal }) => fetchFlightSearch(tripId, request, signal),
        enabled:
          enabled &&
          (leg.results.length === 0 || leg.results.every((r) => !r.bookingToken)) &&
          !!leg.departureDate &&
          travelers > 0,
        staleTime: 5 * 60 * 1000,
        retry: 1,
      };
    }),
  });

  const getResultsForLeg = useCallback(
    (fromIata: string, toIata: string, date: string) => {
      const index = legs.findIndex(
        (leg) => leg.fromIata === fromIata && leg.toIata === toIata && leg.departureDate === date
      );
      const query = index >= 0 ? queries[index] : undefined;

      return {
        results: query?.data?.results ?? [],
        loading: Boolean(query?.isFetching),
        error: query?.error instanceof Error ? query.error.message : null,
        fetchedAt: query?.data?.fetchedAt ?? null,
      };
    },
    [legs, queries]
  );

  return {
    getResultsForLeg,
    isLoading: queries.some((query) => query.isFetching),
  };
}
