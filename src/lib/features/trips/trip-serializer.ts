import { parseItineraryData } from "@/lib/utils/trip-metadata";
import type { TripWithActiveItinerary } from "./trip-query-service";

export function serializeStoredItinerary<T extends { data: unknown }>(itinerary: T) {
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

export function serializeSharedTrip(trip: TripWithActiveItinerary) {
  return {
    trip: {
      id: trip.id,
      region: trip.region,
      dateStart: trip.dateStart,
      dateEnd: trip.dateEnd,
      travelers: trip.travelers,
    },
    itinerary: parseItineraryData(trip.itineraries[0].data),
  };
}
