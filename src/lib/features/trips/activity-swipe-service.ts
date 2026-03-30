import { prisma } from "@/lib/core/prisma";
import { createLogger } from "@/lib/core/logger";
import { findActiveItinerary } from "./itinerary-service";
import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import { PACE_ACTIVITIES_PER_DAY, resolvePaceInput } from "@/lib/features/profile/pace";
import { assignActivitiesToDays } from "./activity-assignment-service";
import type { CityProgress, CityStop, ActivityPace } from "@/types";

const log = createLogger("activity-swipe-service");

interface RecordActivitySwipeInput {
  tripId: string;
  activityId: string;
  decision: "liked" | "disliked";
  cityId: string;
}

interface SwipeResult {
  cityProgress: CityProgress;
  batchComplete: boolean;
  nextCityId: string | null;
  allCitiesComplete: boolean;
}

/**
 * Count non-travel days for a city in the route.
 * A city's last day before the next city is a travel day (handled by recalculateTravelDays),
 * so for N cities in route, city boundaries lose 1 day each (except the last city).
 */
function countNonTravelDays(route: CityStop[], cityId: string): number {
  const cityIdx = route.findIndex((s) => s.id === cityId);
  if (cityIdx === -1) return 0;
  const city = route[cityIdx];
  const isLastCity = cityIdx === route.length - 1;
  // Last day of non-last cities is a travel day
  return isLastCity ? city.days : Math.max(0, city.days - 1);
}

/** Compute required liked activities for a city based on pace. */
function computeRequiredCount(route: CityStop[], cityId: string, pace: ActivityPace): number {
  const nonTravelDays = countNonTravelDays(route, cityId);
  return nonTravelDays * PACE_ACTIVITIES_PER_DAY[pace];
}

/** Get discoverable cities — cities with at least 1 non-travel day, in route order. */
function getDiscoverableCities(route: CityStop[]): CityStop[] {
  return route.filter((_, idx) => {
    const city = route[idx];
    const isLast = idx === route.length - 1;
    const nonTravelDays = isLast ? city.days : Math.max(0, city.days - 1);
    return nonTravelDays > 0;
  });
}

export async function recordActivitySwipe(input: RecordActivitySwipeInput): Promise<SwipeResult> {
  const { tripId, activityId, decision, cityId } = input;

  // Record the swipe
  await prisma.discoveredActivity.update({
    where: { id: activityId },
    data: { decision, decidedAt: new Date() },
  });

  // Load itinerary route and profile pace
  const itineraryRecord = await findActiveItinerary(tripId);
  if (!itineraryRecord) {
    throw new Error(`No active itinerary for trip ${tripId}`);
  }
  const itinerary = parseItineraryData(itineraryRecord.data);
  const route = itinerary.route;

  // Resolve pace from profile
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    select: { profileId: true },
  });
  let pace: ActivityPace = "moderate";
  if (trip.profileId) {
    const profile = await prisma.profile.findUnique({
      where: { id: trip.profileId },
      select: { activityLevel: true },
    });
    if (profile) {
      pace = resolvePaceInput({ activityLevel: profile.activityLevel }) ?? "moderate";
    }
  }

  const discoverableCities = getDiscoverableCities(route);
  const requiredCount = computeRequiredCount(route, cityId, pace);

  // Count liked activities for this city
  const likedCount = await prisma.discoveredActivity.count({
    where: { tripId, cityId, decision: "liked" },
  });

  const cityComplete = likedCount >= requiredCount;

  // Check if all unswiped cards in this city's current batch are done
  const unswipedInCity = await prisma.discoveredActivity.count({
    where: { tripId, cityId, decision: null },
  });
  const batchComplete = unswipedInCity === 0;

  // Determine next city
  const currentCityIdx = discoverableCities.findIndex((c) => c.id === cityId);
  let nextCityId: string | null = null;
  let allCitiesComplete = false;

  if (cityComplete) {
    // Check if all cities are complete
    const allComplete = await checkAllCitiesComplete(tripId, discoverableCities, route, pace);
    allCitiesComplete = allComplete;

    if (!allComplete && currentCityIdx < discoverableCities.length - 1) {
      // Find the next incomplete city
      for (let i = currentCityIdx + 1; i < discoverableCities.length; i++) {
        const cId = discoverableCities[i].id;
        const cRequired = computeRequiredCount(route, cId, pace);
        const cLiked = await prisma.discoveredActivity.count({
          where: { tripId, cityId: cId, decision: "liked" },
        });
        if (cLiked < cRequired) {
          nextCityId = cId;
          break;
        }
      }
    }
  }

  // If all cities are complete, trigger assignment
  if (allCitiesComplete) {
    log.info("All cities complete, triggering activity assignment", { tripId });
    await assignActivitiesToDays(tripId, pace);
  }

  return {
    cityProgress: {
      cityId,
      likedCount,
      requiredCount,
      cityComplete,
    },
    batchComplete,
    nextCityId,
    allCitiesComplete,
  };
}

async function checkAllCitiesComplete(
  tripId: string,
  discoverableCities: CityStop[],
  route: CityStop[],
  pace: ActivityPace
): Promise<boolean> {
  for (const city of discoverableCities) {
    const required = computeRequiredCount(route, city.id, pace);
    const liked = await prisma.discoveredActivity.count({
      where: { tripId, cityId: city.id, decision: "liked" },
    });
    if (liked < required) return false;
  }
  return true;
}
