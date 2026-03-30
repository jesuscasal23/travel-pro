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
import type { DiscoveredActivityRow, UserProfile } from "@/types";
import { loadTripContext } from "./trip-query-service";
import { findActiveItinerary } from "./itinerary-service";
import { resolveActivityImages } from "./activity-image-service";

const log = createLogger("discover-activities-service");

const ClaudeDiscoverActivitySchema = z.object({
  name: z.string().min(1).max(160),
  placeName: z.string().min(1).max(200),
  venueType: z.string().min(1).max(120),
  description: z.string().min(1).max(600),
  highlights: z.array(z.string().min(1).max(200)).min(1).max(5),
  category: z.string().min(1).max(80),
  duration: z.string().min(1).max(40),
});

const ClaudeDiscoverActivitiesOutputSchema = z.array(ClaudeDiscoverActivitySchema).max(25);

interface DiscoverActivitiesInput {
  tripId: string;
  profileId: string | null;
  profile: UserProfile;
  cityId: string;
  excludeNames?: string[];
  signal?: AbortSignal;
}

export async function discoverActivities(
  input: DiscoverActivitiesInput
): Promise<DiscoveredActivityRow[]> {
  const { tripId, profileId, profile, cityId, excludeNames, signal } = input;
  const t0 = Date.now();

  const { intent } = await loadTripContext(tripId);
  const itineraryRecord = await findActiveItinerary(tripId);
  if (!itineraryRecord) {
    throw new ActiveItineraryNotFoundError({ tripId });
  }

  const itinerary = parseItineraryData(itineraryRecord.data);
  const city = itinerary.route.find((stop) => stop.id === cityId);
  if (!city) {
    throw new BadRequestError(`City "${cityId}" not found in itinerary route`, {
      cityId,
      tripId,
    });
  }

  // ── Check DB for existing unswiped activities (first batch only) ─────────
  // When excludeNames is provided we're requesting an additional batch,
  // so skip the cache and always generate fresh activities.
  if (!excludeNames || excludeNames.length === 0) {
    const existing = await prisma.discoveredActivity.findMany({
      where: { tripId, cityId },
      orderBy: { createdAt: "asc" },
    });

    if (existing.length > 0) {
      log.info("Returning cached discovered activities", {
        tripId,
        cityId,
        count: existing.length,
      });
      return existing.map(toDiscoveredActivityRow);
    }
  }

  // ── Generate via Claude ──────────────────────────────────────────────────
  if (itineraryRecord.discoveryStatus === "pending") {
    await prisma.itinerary.update({
      where: { id: itineraryRecord.id },
      data: { discoveryStatus: "in_progress" },
    });
  }

  log.info("Generating activity discovery", {
    tripId,
    cityId,
    city: city.city,
    batchNumber: excludeNames ? Math.ceil(excludeNames.length / 25) + 1 : 1,
  });

  const userPrompt = assembleDiscoverActivitiesPrompt(profile, intent, city, excludeNames);
  const claudeStart = Date.now();
  const modelResult = await callClaude(
    userPrompt,
    SYSTEM_PROMPT_DISCOVER_ACTIVITIES,
    MAX_TOKENS_CITY_ACTIVITIES,
    0,
    signal
  );
  const claudeDurationMs = Date.now() - claudeStart;
  const elapsedSoFarMs = Date.now() - t0;
  log.info("Claude call completed, starting image resolution", {
    tripId,
    cityId,
    claudeDurationMs,
    elapsedSoFarMs,
    remainingBudgetMs: 60_000 - elapsedSoFarMs,
    signalAborted: signal?.aborted ?? false,
  });
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

  // ── Bulk-insert into DiscoveredActivity (without images) ──────────────────
  const rows = parsed.data.map((activity) => ({
    tripId,
    profileId,
    cityId,
    city: city.city,
    name: activity.name,
    placeName: activity.placeName,
    venueType: activity.venueType,
    description: activity.description,
    highlights: activity.highlights,
    category: activity.category,
    duration: activity.duration,
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${activity.placeName} ${city.city}`)}`,
    imageUrl: null as string | null,
  }));

  await prisma.discoveredActivity.createMany({ data: rows });

  // Re-read to get generated IDs and timestamps
  const inserted = await prisma.discoveredActivity.findMany({
    where: { tripId, cityId },
    orderBy: { createdAt: "asc" },
  });

  log.info("Discovery activities generated and persisted", {
    tripId,
    cityId,
    activityCount: inserted.length,
    durationMs: Date.now() - t0,
  });

  // Resolve images synchronously — activities without photos are removed
  // so the swipe queue never contains placeholder cards.
  const imageUrls = await resolveActivityImages(
    inserted.map((r) => ({ name: r.placeName ?? r.name })),
    city.city,
    signal
  );

  const hits: { id: string; imageUrl: string }[] = [];
  const missIds: string[] = [];

  for (let i = 0; i < inserted.length; i++) {
    if (imageUrls[i]) {
      hits.push({ id: inserted[i].id, imageUrl: imageUrls[i]! });
    } else {
      missIds.push(inserted[i].id);
    }
  }

  // Update resolved image URLs and remove no-image activities in parallel
  await Promise.all([
    ...hits.map((h) =>
      prisma.discoveredActivity.update({
        where: { id: h.id },
        data: { imageUrl: h.imageUrl },
      })
    ),
    missIds.length > 0
      ? prisma.discoveredActivity.deleteMany({ where: { id: { in: missIds } } })
      : Promise.resolve(),
  ]);

  log.info("Activity image resolution complete", {
    tripId,
    cityId,
    withImages: hits.length,
    removed: missIds.length,
    durationMs: Date.now() - t0,
  });

  // Re-read final set (only activities with images)
  const final = await prisma.discoveredActivity.findMany({
    where: { tripId, cityId },
    orderBy: { createdAt: "asc" },
  });

  return final.map(toDiscoveredActivityRow);
}

function toDiscoveredActivityRow(row: {
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
  decision: string | null;
  decidedAt: Date | null;
  assignedDay: number | null;
  assignedOrder: number | null;
}): DiscoveredActivityRow {
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
    decision: row.decision as DiscoveredActivityRow["decision"],
    decidedAt: row.decidedAt?.toISOString() ?? null,
    assignedDay: row.assignedDay,
    assignedOrder: row.assignedOrder,
  };
}
