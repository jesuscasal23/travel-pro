import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import type { TripWithActiveItinerary } from "./trip-query-service";

function serializeStoredItinerary<T extends { data: unknown }>(itinerary: T) {
  return {
    ...itinerary,
    data: parseItineraryData(itinerary.data),
  };
}

export function serializeTrip(trip: TripWithActiveItinerary) {
  return {
    ...trip,
    itineraries: trip.itineraries.map(serializeStoredItinerary),
  };
}
