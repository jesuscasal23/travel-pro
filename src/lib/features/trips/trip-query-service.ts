import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/prisma";
import type { TripIntent } from "@/types";
import { TripNotFoundError } from "@/lib/api/errors";
import { STALE_BUILD_MAX_AGE_MS } from "@/lib/config/constants";
import { TRIP_INTENT_SELECT, TRIP_WITH_ACTIVE_ITINERARY_INCLUDE } from "./query-shapes";
import { tripToIntent } from "./trip-intent";

type TripIntentSource = Prisma.TripGetPayload<{ select: typeof TRIP_INTENT_SELECT }>;
export type TripWithActiveItinerary = Prisma.TripGetPayload<{
  include: typeof TRIP_WITH_ACTIVE_ITINERARY_INCLUDE;
}>;

interface TripContext {
  trip: TripIntentSource;
  intent: TripIntent;
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

  // Lazy cleanup: if the active itinerary is stuck in "building" past the
  // threshold, mark it as failed so the client can show a retry prompt.
  const active = trip.itineraries[0];
  if (
    active?.buildStatus === "building" &&
    Date.now() - active.createdAt.getTime() > STALE_BUILD_MAX_AGE_MS
  ) {
    await prisma.itinerary.update({
      where: { id: active.id },
      data: { buildStatus: "failed" },
    });
    active.buildStatus = "failed";
  }

  return trip;
}
