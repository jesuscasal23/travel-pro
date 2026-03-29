import { apiFetch, ApiError } from "@/lib/client/api-fetch";
import type { DiscoveryStatus, Itinerary, TripSummary, TripType } from "@/types";

interface TripDetailItinerary {
  id: string;
  buildStatus: string;
  discoveryStatus: DiscoveryStatus;
  data: Itinerary;
}

interface TripDetail {
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

interface TripsResponse {
  trips: TripSummary[];
  isSuperUser: boolean;
}

export async function fetchTrips(): Promise<TripsResponse> {
  const data = await apiFetch<{ trips?: TripSummary[]; isSuperUser?: boolean }>("/api/v1/trips", {
    source: "useTrips",
    fallbackMessage: "Failed to load trips",
  });
  return { trips: data.trips ?? [], isSuperUser: data.isSuperUser ?? false };
}

export async function fetchTrip(tripId: string): Promise<TripDetail | null> {
  try {
    const data = await apiFetch<{ trip?: TripDetail }>(`/api/v1/trips/${tripId}`, {
      source: "useTrip",
      fallbackMessage: "Failed to load trip",
    });
    return data.trip ?? null;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      console.warn(
        "[fetchTrip] Trip fetch returned %d for tripId=%s (requestId=%s)",
        error.status,
        tripId,
        error.requestId
      );
      return null;
    }
    throw error;
  }
}
