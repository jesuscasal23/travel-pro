import type { QueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/client/api-fetch";
import { queryKeys } from "@/hooks/api/keys";
import type { Itinerary, TripSummary, TripType } from "@/types";

export interface TripDetailItinerary {
  id: string;
  generationStatus: string;
  data: Itinerary;
}

export interface TripDetail {
  id: string;
  tripType?: TripType;
  region: string;
  destination?: string | null;
  destinationCountry?: string | null;
  destinationCountryCode?: string | null;
  dateStart: string;
  dateEnd: string;
  travelers: number;
  createdAt: string;
  itineraries: TripDetailItinerary[];
}

export async function fetchTrips(): Promise<TripSummary[]> {
  const data = await apiFetch<{ trips?: TripSummary[] }>("/api/v1/trips", {
    source: "useTrips",
    fallbackMessage: "Failed to load trips",
  });
  return data.trips ?? [];
}

export async function fetchTrip(tripId: string): Promise<TripDetail | null> {
  try {
    const data = await apiFetch<{ trip?: TripDetail }>(`/api/v1/trips/${tripId}`, {
      source: "useTrip",
      fallbackMessage: "Failed to load trip",
    });
    return data.trip ?? null;
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403 || error.status === 404)
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Optimistically update the active itinerary data in the trip detail cache,
 * then invalidate so background refetch picks up the server state.
 */
export function updateTripDetailCache(
  queryClient: QueryClient,
  tripId: string,
  newData: Itinerary
): void {
  queryClient.setQueryData(
    queryKeys.trips.detail(tripId),
    (
      previous:
        | {
            itineraries?: Array<Record<string, unknown>>;
          }
        | null
        | undefined
    ) => {
      if (!previous?.itineraries?.length) return previous;
      const [first, ...rest] = previous.itineraries;
      return {
        ...previous,
        itineraries: [{ ...first, data: newData }, ...rest],
      };
    }
  );
}
