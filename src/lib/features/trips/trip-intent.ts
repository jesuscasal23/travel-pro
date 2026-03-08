import type { Prisma } from "@prisma/client";
import type { TripIntent } from "@/types";
import { TRIP_INTENT_SELECT } from "./query-shapes";

export type TripIntentRecord = Prisma.TripGetPayload<{ select: typeof TRIP_INTENT_SELECT }>;

export function tripToIntent(trip: TripIntentRecord): TripIntent {
  return {
    id: trip.id,
    tripType: (trip.tripType as TripIntent["tripType"]) ?? "multi-city",
    region: trip.region,
    destination: trip.destination ?? undefined,
    destinationCountry: trip.destinationCountry ?? undefined,
    destinationCountryCode: trip.destinationCountryCode ?? undefined,
    dateStart: trip.dateStart,
    dateEnd: trip.dateEnd,
    flexibleDates: trip.flexibleDates,
    travelers: trip.travelers,
    description: trip.description ?? undefined,
  };
}
