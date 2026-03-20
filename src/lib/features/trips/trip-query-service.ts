import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/prisma";
import { parseItineraryData } from "@/lib/utils/trip-metadata";
import type { Itinerary, TripIntent } from "@/types";
import { ActiveItineraryNotFoundError, TripNotFoundError } from "@/lib/api/errors";
import { STALE_GENERATION_MAX_AGE_MS } from "@/lib/config/constants";
import { TRIP_INTENT_SELECT, TRIP_WITH_ACTIVE_ITINERARY_INCLUDE } from "./query-shapes";
import { tripToIntent } from "./trip-intent";

export type TripIntentSource = Prisma.TripGetPayload<{ select: typeof TRIP_INTENT_SELECT }>;
export type TripWithActiveItinerary = Prisma.TripGetPayload<{
  include: typeof TRIP_WITH_ACTIVE_ITINERARY_INCLUDE;
}>;

export interface TripContext {
  trip: TripIntentSource;
  intent: TripIntent;
}

export interface TripWithActiveItineraryContext {
  trip: TripWithActiveItinerary;
  intent: TripIntent;
  activeItineraryRecord: TripWithActiveItinerary["itineraries"][number];
  itinerary: Itinerary;
}

export interface SharedTripContext {
  trip: TripWithActiveItinerary;
  itinerary: Itinerary;
}

export async function loadTripContext(tripId: string): Promise<TripContext> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: TRIP_INTENT_SELECT,
  });
  if (!trip) {
    throw new TripNotFoundError({ tripId });
  }

  return {
    trip,
    intent: tripToIntent(trip),
  };
}

export async function loadTripWithActiveItineraries(
  tripId: string
): Promise<TripWithActiveItinerary> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: TRIP_WITH_ACTIVE_ITINERARY_INCLUDE,
  });

  if (!trip) {
    throw new TripNotFoundError({ tripId });
  }

  // Lazy cleanup: if the active itinerary is stuck in "generating" past the
  // threshold, mark it as failed so the client can show a retry prompt.
  const active = trip.itineraries[0];
  if (
    active?.generationStatus === "generating" &&
    Date.now() - active.createdAt.getTime() > STALE_GENERATION_MAX_AGE_MS
  ) {
    await prisma.itinerary.update({
      where: { id: active.id },
      data: { generationStatus: "failed" },
    });
    active.generationStatus = "failed";
  }

  return trip;
}

export async function loadTripWithActiveItineraryContext(
  tripId: string
): Promise<TripWithActiveItineraryContext> {
  const trip = await loadTripWithActiveItineraries(tripId);
  const activeItineraryRecord = trip.itineraries[0];
  if (!activeItineraryRecord) {
    throw new ActiveItineraryNotFoundError({ tripId });
  }

  return {
    trip,
    intent: tripToIntent(trip),
    activeItineraryRecord,
    itinerary: parseItineraryData(activeItineraryRecord.data),
  };
}

export async function loadSharedTripContext(token: string): Promise<SharedTripContext> {
  const trip = await prisma.trip.findFirst({
    where: { shareToken: token },
    include: TRIP_WITH_ACTIVE_ITINERARY_INCLUDE,
  });

  if (!trip || trip.itineraries.length === 0) {
    throw new TripNotFoundError({ shareToken: token });
  }

  return {
    trip,
    itinerary: parseItineraryData(trip.itineraries[0].data),
  };
}
