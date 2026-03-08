import type { Prisma } from "@prisma/client";

export const TRIP_ACCESS_SELECT = {
  profileId: true,
} satisfies Prisma.TripSelect;

export const TRIP_INTENT_SELECT = {
  id: true,
  tripType: true,
  region: true,
  destination: true,
  destinationCountry: true,
  destinationCountryCode: true,
  dateStart: true,
  dateEnd: true,
  flexibleDates: true,
  travelers: true,
  description: true,
} satisfies Prisma.TripSelect;

export const ACTIVE_ITINERARY_SUMMARY_SELECT = {
  id: true,
  version: true,
  generationStatus: true,
  createdAt: true,
} satisfies Prisma.ItinerarySelect;

export const TRIP_WITH_ACTIVE_ITINERARY_INCLUDE = {
  itineraries: {
    where: { isActive: true },
    orderBy: { version: "desc" as const },
    take: 1,
  },
} satisfies Prisma.TripInclude;

export const TRIP_LIST_INCLUDE = {
  itineraries: {
    where: { isActive: true },
    select: ACTIVE_ITINERARY_SUMMARY_SELECT,
    take: 1,
  },
} satisfies Prisma.TripInclude;

export const SHARE_TOKEN_SELECT = {
  shareToken: true,
} satisfies Prisma.TripSelect;

export const ITINERARY_TRIP_ID_SELECT = {
  tripId: true,
} satisfies Prisma.ItinerarySelect;

export const GENERATING_ITINERARY_SELECT = {
  id: true,
  generationJobId: true,
  createdAt: true,
} satisfies Prisma.ItinerarySelect;

export const ITINERARY_VERSION_SELECT = {
  version: true,
} satisfies Prisma.ItinerarySelect;
