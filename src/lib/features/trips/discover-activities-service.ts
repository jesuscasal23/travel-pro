import { z } from "zod";
import { BadRequestError, ActiveItineraryNotFoundError } from "@/lib/api/errors";
import { throwIfAborted } from "@/lib/core/abort";
import { createLogger } from "@/lib/core/logger";
import { prisma } from "@/lib/core/prisma";
import { MAX_TOKENS_CITY_ACTIVITIES } from "@/lib/config/constants";
import { callClaude } from "@/lib/ai/client";
import { extractJSON } from "@/lib/ai/parser";
import {
  SYSTEM_PROMPT_DISCOVER_ACTIVITIES,
  assembleDiscoverActivitiesPrompt,
} from "@/lib/ai/prompts/discover-activities";
import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import type { ActivityDiscoveryCandidate, UserProfile } from "@/types";
import { loadTripContext } from "./trip-query-service";
import { findActiveItinerary } from "./itinerary-service";

const log = createLogger("discover-activities-service");

const ClaudeDiscoverActivitySchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().min(1).max(600),
  category: z.string().min(1).max(80),
  duration: z.string().min(1).max(40),
});

const ClaudeDiscoverActivitiesOutputSchema = z.array(ClaudeDiscoverActivitySchema).max(5);

interface DiscoverActivitiesBatchInput {
  tripId: string;
  profile: UserProfile;
  cityId: string;
  batchIndex: number;
  signal?: AbortSignal;
}

export async function discoverActivitiesBatch(
  input: DiscoverActivitiesBatchInput
): Promise<ActivityDiscoveryCandidate[]> {
  const { tripId, profile, cityId, batchIndex, signal } = input;
  const t0 = Date.now();

  const { intent } = await loadTripContext(tripId);
  const itineraryRecord = await findActiveItinerary(tripId);
  if (!itineraryRecord) {
    throw new ActiveItineraryNotFoundError({ tripId });
  }

  if (itineraryRecord.discoveryStatus === "pending") {
    await prisma.itinerary.update({
      where: { id: itineraryRecord.id },
      data: { discoveryStatus: "in_progress" },
    });
  }

  const itinerary = parseItineraryData(itineraryRecord.data);
  const city = itinerary.route.find((stop) => stop.id === cityId);
  if (!city) {
    throw new BadRequestError(`City "${cityId}" not found in itinerary route`, {
      cityId,
      tripId,
    });
  }

  log.info("Generating activity discovery batch", {
    tripId,
    cityId,
    city: city.city,
    batchIndex,
  });

  const userPrompt = assembleDiscoverActivitiesPrompt(profile, intent, city, batchIndex);
  const modelResult = await callClaude(
    userPrompt,
    SYSTEM_PROMPT_DISCOVER_ACTIVITIES,
    MAX_TOKENS_CITY_ACTIVITIES,
    0,
    signal
  );
  throwIfAborted(signal);

  const json = extractJSON(modelResult.text);
  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(json);
  } catch {
    throw new Error("Discovery activities output is not valid JSON");
  }

  const parsed = ClaudeDiscoverActivitiesOutputSchema.safeParse(parsedUnknown);
  if (!parsed.success) {
    const details = parsed.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Discovery activities schema validation failed: ${details}`);
  }

  const activities: ActivityDiscoveryCandidate[] = parsed.data.map((activity) => ({
    name: activity.name,
    description: activity.description,
    category: activity.category,
    duration: activity.duration,
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${activity.name} ${city.city}`)}`,
    imageUrl: null,
  }));

  log.info("Discovery batch generated", {
    tripId,
    cityId,
    batchIndex,
    activityCount: activities.length,
    durationMs: Date.now() - t0,
  });

  return activities;
}
