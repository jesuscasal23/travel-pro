import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { apiFetch, ApiError } from "@/lib/client/api-fetch";
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

async function fetchTrips(): Promise<TripSummary[]> {
  const data = await apiFetch<{ trips?: TripSummary[] }>("/api/v1/trips", {
    source: "useTrips",
    fallbackMessage: "Failed to load trips",
  });
  return data.trips ?? [];
}

export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: fetchTrips,
  });
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

export function useTrip(tripId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.trips.detail(tripId),
    queryFn: () => fetchTrip(tripId),
    enabled: options?.enabled ?? true,
  });
}
