// ============================================================
// Travel Pro — POST /api/v1/trips/[id]/generate-activities
// Generate activities for a single city within an existing itinerary.
// ============================================================
import { prisma } from "@/lib/db/prisma";
import { generateCityActivities } from "@/lib/ai/pipeline";
import {
  apiHandler,
  ApiError,
  assertTripAccess,
  parseJsonBody,
  validateBody,
} from "@/lib/api/helpers";
import { GenerateActivitiesInputSchema } from "@/lib/api/schemas";
import { tripToIntent } from "@/lib/services/trip-service";
import { findActiveItinerary } from "@/lib/services/itinerary-service";
import type { Itinerary } from "@/types";
import { createLogger } from "@/lib/logger";
import { parseItineraryData } from "@/lib/utils/trip-metadata";
import { throwIfAborted } from "@/lib/abort";

const log = createLogger("api/v1/trips/generate-activities");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = apiHandler(
  "POST /api/v1/trips/:id/generate-activities",
  async (req, params) => {
    const signal = req.signal;
    await assertTripAccess(req, params.id, { requireOwnershipForUserTrips: true });

    const body = await parseJsonBody(req);
    const { profile, cityId } = validateBody(GenerateActivitiesInputSchema, body);

    // Load the trip
    const trip = await prisma.trip.findUnique({ where: { id: params.id } });
    if (!trip) throw new ApiError(404, "Trip not found");

    // Find active itinerary
    const itineraryRecord = await findActiveItinerary(params.id);
    if (!itineraryRecord) throw new ApiError(404, "No active itinerary found");

    const itinerary = parseItineraryData(itineraryRecord.data);

    // Validate cityId exists in route
    const cityStop = itinerary.route.find((r) => r.id === cityId);
    if (!cityStop) throw new ApiError(400, `City "${cityId}" not found in itinerary route`);

    // If city already has activities, return current itinerary (idempotent)
    const cityDays = itinerary.days.filter((d) => d.city === cityStop.city);
    const alreadyHasActivities = cityDays.some((d) => d.activities.length > 0);
    if (alreadyHasActivities) {
      log.info("Activities already exist for city, returning current itinerary", {
        tripId: params.id,
        cityId,
        city: cityStop.city,
      });
      return Response.json({ itinerary });
    }

    const intent = tripToIntent(trip);

    log.info("Generating activities for city", { tripId: params.id, cityId, city: cityStop.city });

    // Generate activities
    const updatedDays = await generateCityActivities(profile, intent, itinerary, cityId, {
      signal,
    });
    throwIfAborted(signal);

    // Merge into itinerary — replace days for this city with the activity-populated versions
    const mergedDays = itinerary.days.map((day) => {
      if (day.city !== cityStop.city) return day;
      const updated = updatedDays.find((u) => u.day === day.day);
      return updated ? { ...day, activities: updated.activities } : day;
    });

    const mergedItinerary: Itinerary = { ...itinerary, days: mergedDays };

    // Persist to DB
    await prisma.itinerary.update({
      where: { id: itineraryRecord.id },
      data: { data: mergedItinerary as object },
    });

    log.info("City activities saved", {
      tripId: params.id,
      cityId,
      activitiesCount: updatedDays.reduce((s, d) => s + d.activities.length, 0),
    });

    return Response.json({ itinerary: mergedItinerary });
  }
);
