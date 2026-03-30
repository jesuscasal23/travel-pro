import { prisma } from "@/lib/core/prisma";
import { createLogger } from "@/lib/core/logger";
import { findActiveItinerary } from "./itinerary-service";
import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import { buildDaysFromRoute } from "@/lib/utils/trip/build-days-from-route";
import { PACE_ACTIVITIES_PER_DAY } from "@/lib/features/profile/pace";
import type { ActivityPace, TripDay } from "@/types";

const log = createLogger("activity-assignment-service");

/**
 * Assign liked discovered activities to itinerary days.
 *
 * Algorithm (V1 — simple sequential):
 * 1. Build structural days from route
 * 2. Query liked activities per city ordered by decidedAt ASC
 * 3. For each city: distribute round-robin across non-travel days
 * 4. Persist assignedDay/assignedOrder on DiscoveredActivity rows
 * 5. Create new itinerary version with structural days (no activities in JSON)
 * 6. Set discoveryStatus: "completed"
 */
export async function assignActivitiesToDays(tripId: string, pace: ActivityPace): Promise<void> {
  const itineraryRecord = await findActiveItinerary(tripId);
  if (!itineraryRecord) {
    throw new Error(`No active itinerary for trip ${tripId}`);
  }

  const itinerary = parseItineraryData(itineraryRecord.data);
  const route = itinerary.route;

  // Load trip dateStart
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    select: { dateStart: true },
  });

  // Build structural days from route
  const days = buildDaysFromRoute(route, trip.dateStart);
  const activitiesPerDay = PACE_ACTIVITIES_PER_DAY[pace];

  // Query liked activities per city, ordered by decidedAt
  const likedActivities = await prisma.discoveredActivity.findMany({
    where: { tripId, decision: "liked" },
    orderBy: { decidedAt: "asc" },
  });

  // Group liked activities by cityId
  const likedByCity = new Map<string, { id: string; cityId: string }[]>();
  for (const activity of likedActivities) {
    const list = likedByCity.get(activity.cityId) ?? [];
    list.push({ id: activity.id, cityId: activity.cityId });
    likedByCity.set(activity.cityId, list);
  }

  // Assign activities to days
  const updates: { id: string; assignedDay: number; assignedOrder: number }[] = [];

  for (const stop of route) {
    const cityActivities = likedByCity.get(stop.id) ?? [];
    if (cityActivities.length === 0) continue;

    // Get non-travel days for this city
    const cityDays = days.filter((d) => d.city === stop.city && !d.isTravel);

    let activityIdx = 0;
    for (const day of cityDays) {
      for (let slot = 1; slot <= activitiesPerDay; slot++) {
        if (activityIdx >= cityActivities.length) break;
        updates.push({
          id: cityActivities[activityIdx].id,
          assignedDay: day.day,
          assignedOrder: slot,
        });
        activityIdx++;
      }
      if (activityIdx >= cityActivities.length) break;
    }
  }

  // Persist assignments in a transaction
  await prisma.$transaction([
    // Clear any prior assignments for this trip (in case of re-run)
    prisma.discoveredActivity.updateMany({
      where: { tripId, assignedDay: { not: null } },
      data: { assignedDay: null, assignedOrder: null },
    }),
    // Apply new assignments
    ...updates.map((u) =>
      prisma.discoveredActivity.update({
        where: { id: u.id },
        data: { assignedDay: u.assignedDay, assignedOrder: u.assignedOrder },
      })
    ),
    // Create new itinerary version with structural days (empty activities)
    // Deactivate current version
    prisma.itinerary.update({
      where: { id: itineraryRecord.id },
      data: { isActive: false },
    }),
    prisma.itinerary.create({
      data: {
        tripId,
        data: {
          route,
          days: days.map(stripActivities),
          visaData: itinerary.visaData,
          weatherData: itinerary.weatherData,
          accommodationData: itinerary.accommodationData,
          flightLegs: itinerary.flightLegs,
          flightOptions: itinerary.flightOptions,
        } as object,
        version: itineraryRecord.version + 1,
        isActive: true,
        promptVersion: "v1",
        buildStatus: "complete",
        discoveryStatus: "completed",
      },
    }),
  ]);

  log.info("Activity assignment completed", {
    tripId,
    assignedCount: updates.length,
    totalDays: days.length,
    pace,
  });
}

function stripActivities(day: TripDay): TripDay {
  return { ...day, activities: [] };
}
