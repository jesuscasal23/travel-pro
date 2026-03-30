import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import type { AssignedActivity } from "@/types";
import type { TripWithActiveItinerary } from "./trip-query-service";

function serializeStoredItinerary<T extends { data: unknown }>(itinerary: T) {
  return {
    ...itinerary,
    data: parseItineraryData(itinerary.data),
  };
}

function serializeAssignedActivity(row: {
  id: string;
  cityId: string;
  city: string;
  name: string;
  placeName: string | null;
  venueType: string | null;
  description: string;
  highlights: string[];
  category: string;
  duration: string;
  googleMapsUrl: string | null;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
  decision: string | null;
  decidedAt: Date | null;
  assignedDay: number | null;
  assignedOrder: number | null;
}): AssignedActivity {
  return {
    id: row.id,
    cityId: row.cityId,
    city: row.city,
    name: row.name,
    placeName: row.placeName,
    venueType: row.venueType,
    description: row.description,
    highlights: row.highlights,
    category: row.category,
    duration: row.duration,
    googleMapsUrl: row.googleMapsUrl ?? "",
    imageUrl: row.imageUrl,
    lat: row.lat,
    lng: row.lng,
    decision: row.decision as AssignedActivity["decision"],
    decidedAt: row.decidedAt?.toISOString() ?? null,
    assignedDay: row.assignedDay!,
    assignedOrder: row.assignedOrder!,
  };
}

export function serializeTrip(trip: TripWithActiveItinerary) {
  return {
    ...trip,
    itineraries: trip.itineraries.map(serializeStoredItinerary),
    assignedActivities: trip.discoveredActivities.map(serializeAssignedActivity),
  };
}
