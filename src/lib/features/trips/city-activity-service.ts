import { generateCityActivities } from "@/lib/ai/pipeline";
import { ActiveItineraryNotFoundError, BadRequestError } from "@/lib/api/errors";
import { throwIfAborted } from "@/lib/core/abort";
import { prisma } from "@/lib/core/prisma";
import { loadTripContext } from "./trip-query-service";
import { createLogger } from "@/lib/core/logger";
import { findActiveItinerary } from "./itinerary-service";
import { mergeGeneratedCityDays } from "@/lib/utils/trip/merge-generated-city-days";
import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import type { Itinerary, UserProfile } from "@/types";

const log = createLogger("city-activity-service");

interface GenerateActivitiesForCityInput {
  tripId: string;
  profile: UserProfile;
  cityId: string;
  signal?: AbortSignal;
}

export async function generateActivitiesForCity(
  input: GenerateActivitiesForCityInput
): Promise<Itinerary> {
  const { intent } = await loadTripContext(input.tripId);
  const itineraryRecord = await findActiveItinerary(input.tripId);
  if (!itineraryRecord) {
    throw new ActiveItineraryNotFoundError({ tripId: input.tripId });
  }

  const itinerary = parseItineraryData(itineraryRecord.data);
  const cityStop = itinerary.route.find((stop) => stop.id === input.cityId);
  if (!cityStop) {
    throw new BadRequestError(`City "${input.cityId}" not found in itinerary route`, {
      cityId: input.cityId,
      tripId: input.tripId,
    });
  }

  const cityDays = itinerary.days.filter((day) => day.city === cityStop.city);
  const alreadyHasActivities = cityDays.some((day) => day.activities.length > 0);
  if (alreadyHasActivities) {
    log.info("Activities already exist for city, returning current itinerary", {
      tripId: input.tripId,
      cityId: input.cityId,
      city: cityStop.city,
    });
    return itinerary;
  }

  log.info("Generating activities for city", {
    tripId: input.tripId,
    cityId: input.cityId,
    city: cityStop.city,
  });

  const updatedDays = await generateCityActivities(input.profile, intent, itinerary, input.cityId, {
    signal: input.signal,
  });
  throwIfAborted(input.signal);

  const mergedItinerary = mergeGeneratedCityDays(itinerary, cityStop.city, updatedDays);

  await prisma.itinerary.update({
    where: { id: itineraryRecord.id },
    data: { data: mergedItinerary as object, discoveryStatus: "completed" },
  });

  log.info("City activities saved", {
    tripId: input.tripId,
    cityId: input.cityId,
    activitiesCount: updatedDays.reduce((sum, day) => sum + day.activities.length, 0),
  });

  return mergedItinerary;
}
