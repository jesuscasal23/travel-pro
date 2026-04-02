import { BadRequestError, ActiveItineraryNotFoundError } from "@/lib/api/errors";
import { throwIfAborted } from "@/lib/core/abort";
import { createLogger } from "@/lib/core/logger";
import { prisma } from "@/lib/core/prisma";
import {
  MAX_TOKENS_CITY_ACTIVITIES,
  MAX_DISCOVERY_ROUNDS_PER_CITY,
  MAX_ACTIVITY_DISTANCE_KM,
  MIN_REACHABLE_ACTIVITY_COUNT,
  AVERAGE_CITY_DRIVE_SPEED_KMH,
} from "@/lib/config/constants";
import { callClaude } from "@/lib/ai/client";
import { extractJSON } from "@/lib/ai/parser";
import type { z } from "zod";
import {
  ClaudeDiscoverActivitiesOutputSchema,
  ClaudeDiscoverActivitySchema,
} from "@/lib/ai/schemas/discover-activities";
import {
  SYSTEM_PROMPT_DISCOVER_ACTIVITIES,
  assembleDiscoverActivitiesPrompt,
} from "@/lib/ai/prompts/discover-activities";
import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import type { CityStop, DiscoveredActivityRow, UserProfile } from "@/types";
import { haversineDistanceKm, distanceKmToMinutes } from "@/lib/utils/geo/distance";
import { loadTripContext } from "./trip-query-service";
import { findActiveItinerary } from "./itinerary-service";
import { resolveActivityImages } from "./activity-image-service";
import { findPlace } from "@/lib/google-places/client";

const log = createLogger("discover-activities-service");
const PLACE_VERIFICATION_TIMEOUT_MS = 3_000;

interface DiscoverActivitiesInput {
  tripId: string;
  profileId: string | null;
  profile: UserProfile;
  cityId: string;
  excludeNames?: string[];
  signal?: AbortSignal;
  _autoRetryCount?: number;
  _internalExcludeNames?: string[];
  _skipCache?: boolean;
  _reachabilityStats?: ReachabilityStats;
}

interface ReachabilityStats {
  filtered: number;
  verifiedFiltered: number;
  autoRegenerated: boolean;
}

export interface DiscoverActivitiesResult {
  activities: DiscoveredActivityRow[];
  roundLimitReached: boolean;
  reachability: ReachabilityStats;
}

const MAX_AUTO_RETRY_ROUNDS = 2;

export async function discoverActivities(
  input: DiscoverActivitiesInput
): Promise<DiscoverActivitiesResult> {
  const {
    tripId,
    profileId,
    profile,
    cityId,
    excludeNames,
    signal,
    _autoRetryCount = 0,
    _internalExcludeNames = [],
    _skipCache = false,
    _reachabilityStats,
  } = input;
  const t0 = Date.now();
  let internalExcludeNames = [..._internalExcludeNames];
  const reachabilityStats: ReachabilityStats = _reachabilityStats ?? {
    filtered: 0,
    verifiedFiltered: 0,
    autoRegenerated: false,
  };

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
  // When excludeNames is provided or skipCache is true we're requesting an additional batch,
  // so skip the cache and always generate fresh activities.
  if (!_skipCache && (!excludeNames || excludeNames.length === 0)) {
    const existing = await prisma.discoveredActivity.findMany({
      where: { tripId, cityId },
      orderBy: { createdAt: "asc" },
    });

    if (existing.length > 0) {
      const { reachableRows, unreachableRows } = partitionByReachability(existing, city);
      if (unreachableRows.length > 0) {
        reachabilityStats.filtered += unreachableRows.length;
        internalExcludeNames = mergeExcludeNames(
          internalExcludeNames,
          unreachableRows.map((row) => row.name)
        );
        await prisma.discoveredActivity.deleteMany({
          where: { id: { in: unreachableRows.map((row) => row.id) } },
        });
        log.info("Pruned unreachable cached activities", {
          tripId,
          cityId,
          removed: unreachableRows.length,
        });
      }

      if (reachableRows.length >= MIN_REACHABLE_ACTIVITY_COUNT) {
        log.info("Returning cached discovered activities", {
          tripId,
          cityId,
          count: reachableRows.length,
          filteredOut: unreachableRows.length,
        });
        return {
          activities: reachableRows.map((row) => toDiscoveredActivityRow(row, city)),
          roundLimitReached: false,
          reachability: reachabilityStats,
        };
      }

      internalExcludeNames = mergeExcludeNames(
        internalExcludeNames,
        reachableRows.map((row) => row.name)
      );
    }
  }

  // ── Check per-city round cap ────────────────────────────────────────────
  const priorUserRounds =
    excludeNames && excludeNames.length > 0 ? Math.ceil(excludeNames.length / 25) : 0;
  const batchNumber = priorUserRounds + 1 + _autoRetryCount;
  if (batchNumber > MAX_DISCOVERY_ROUNDS_PER_CITY) {
    log.info("Discovery round limit reached", { tripId, cityId, batchNumber });
    return { activities: [], roundLimitReached: true, reachability: reachabilityStats };
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
    batchNumber,
  });

  const promptExcludeNames =
    internalExcludeNames.length > 0 || (excludeNames?.length ?? 0) > 0
      ? mergeExcludeNames(excludeNames ?? [], internalExcludeNames)
      : excludeNames;

  const userPrompt = assembleDiscoverActivitiesPrompt(
    profile,
    intent,
    city,
    promptExcludeNames && promptExcludeNames.length > 0 ? promptExcludeNames : undefined
  );
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

  const reachabilityAnnotated = parsed.data.map((activity) => annotateReachability(activity, city));
  const reachableActivities = reachabilityAnnotated.filter((entry) => entry.reachable);
  const unreachableActivities = reachabilityAnnotated.filter((entry) => !entry.reachable);

  if (unreachableActivities.length > 0) {
    reachabilityStats.filtered += unreachableActivities.length;
    internalExcludeNames = mergeExcludeNames(
      internalExcludeNames,
      unreachableActivities.map((entry) => entry.activity.name)
    );
    log.info("Filtered unreachable activities from generation", {
      tripId,
      cityId,
      filtered: unreachableActivities.length,
    });
  }

  const verificationResult = await verifyActivitiesWithPlaces(
    reachableActivities.map((entry) => entry.activity),
    city,
    signal
  );
  let verifiedActivities = verificationResult.verified;

  if (verificationResult.filteredNames.length > 0) {
    reachabilityStats.verifiedFiltered += verificationResult.filteredNames.length;
    internalExcludeNames = mergeExcludeNames(
      internalExcludeNames,
      verificationResult.filteredNames
    );
    log.info("Filtered activities without Places match", {
      tripId,
      cityId,
      filtered: verificationResult.filteredNames.length,
    });
  }

  const dedupeResult = dedupeVerifiedActivities(verifiedActivities);
  if (dedupeResult.duplicateNames.length > 0) {
    reachabilityStats.verifiedFiltered += dedupeResult.duplicateNames.length;
    internalExcludeNames = mergeExcludeNames(internalExcludeNames, dedupeResult.duplicateNames);
    log.info("Removed duplicate activities with identical place IDs", {
      tripId,
      cityId,
      duplicates: dedupeResult.duplicateNames.length,
    });
  }
  verifiedActivities = dedupeResult.unique;

  // ── Bulk-insert into DiscoveredActivity (without images) ──────────────────
  const rows = verifiedActivities.map((verified) => ({
    tripId,
    profileId,
    cityId,
    city: city.city,
    name: verified.activity.name,
    placeName: verified.canonicalPlaceName,
    venueType: verified.activity.venueType,
    description: verified.activity.description,
    highlights: verified.activity.highlights,
    category: verified.activity.category,
    duration: verified.activity.duration,
    googleMapsUrl: buildGoogleMapsUrl(
      verified.placeId,
      `${verified.canonicalPlaceName} ${city.city}`
    ),
    googlePlaceId: verified.placeId,
    imageUrl: null as string | null,
    imageUrls: [] as string[],
    lat: verified.verifiedLat ?? verified.activity.lat,
    lng: verified.verifiedLng ?? verified.activity.lng,
  }));

  if (rows.length > 0) {
    await prisma.discoveredActivity.createMany({ data: rows });
  }

  // Re-read to get generated IDs and timestamps for just-inserted rows (imageUrl null)
  const inserted =
    rows.length > 0
      ? await prisma.discoveredActivity.findMany({
          where: { tripId, cityId, imageUrl: null },
          orderBy: { createdAt: "asc" },
        })
      : [];

  log.info("Discovery activities generated and persisted", {
    tripId,
    cityId,
    activityCount: inserted.length,
    reachabilityFiltered: unreachableActivities.length,
    durationMs: Date.now() - t0,
  });

  let verifiedReachabilityDrops = 0;

  if (inserted.length > 0) {
    const imageResolutions = await resolveActivityImages(
      inserted.map((r) => ({ name: r.placeName ?? r.name })),
      city.city,
      signal
    );

    const hits: {
      id: string;
      imageUrls: string[];
      verifiedLocation?: { lat: number; lng: number } | null;
    }[] = [];
    const missIds: string[] = [];
    const verificationDropIds: string[] = [];
    const verificationDropNames: string[] = [];
    const secondaryShortfallByCategory: Record<string, number> = {};

    for (let i = 0; i < inserted.length; i++) {
      const resolution = imageResolutions[i];
      if (resolution?.verifiedLocation) {
        const withinRange = isWithinReach(
          haversineDistanceKm(
            city.lat,
            city.lng,
            resolution.verifiedLocation.lat,
            resolution.verifiedLocation.lng
          )
        );
        if (!withinRange) {
          verificationDropIds.push(inserted[i].id);
          verificationDropNames.push(inserted[i].name);
          continue;
        }
      }

      if (resolution?.imageUrls.length) {
        hits.push({
          id: inserted[i].id,
          imageUrls: resolution.imageUrls,
          verifiedLocation: resolution.verifiedLocation ?? null,
        });
        if (resolution.imageUrls.length === 1) {
          const category = inserted[i].category;
          secondaryShortfallByCategory[category] =
            (secondaryShortfallByCategory[category] ?? 0) + 1;
        }
      } else {
        missIds.push(inserted[i].id);
      }
    }

    await Promise.all([
      ...hits.map((h) =>
        prisma.discoveredActivity.update({
          where: { id: h.id },
          data: {
            imageUrl: h.imageUrls[0] ?? null,
            imageUrls: h.imageUrls,
            ...(h.verifiedLocation
              ? { lat: h.verifiedLocation.lat, lng: h.verifiedLocation.lng }
              : {}),
          },
        })
      ),
      missIds.length > 0
        ? prisma.discoveredActivity.deleteMany({ where: { id: { in: missIds } } })
        : Promise.resolve(),
    ]);

    if (verificationDropIds.length > 0) {
      await prisma.discoveredActivity.deleteMany({ where: { id: { in: verificationDropIds } } });
      verifiedReachabilityDrops = verificationDropIds.length;
      internalExcludeNames = mergeExcludeNames(internalExcludeNames, verificationDropNames);
    }

    if (Object.keys(secondaryShortfallByCategory).length > 0) {
      log.info("Secondary activity images missing", {
        tripId,
        cityId,
        city: city.city,
        secondaryShortfallByCategory,
      });
    }

    log.info("Activity image resolution complete", {
      tripId,
      cityId,
      withImages: hits.length,
      removed: missIds.length,
      removedByVerification: verificationDropIds.length,
      durationMs: Date.now() - t0,
    });
  }

  if (verifiedReachabilityDrops > 0) {
    reachabilityStats.verifiedFiltered += verifiedReachabilityDrops;
  }

  // Re-read final set (only activities with images)
  const final = await prisma.discoveredActivity.findMany({
    where: { tripId, cityId },
    orderBy: { createdAt: "asc" },
  });

  const finalRows = final.map((row) => toDiscoveredActivityRow(row, city));
  const shouldAutoRetry =
    finalRows.length < MIN_REACHABLE_ACTIVITY_COUNT &&
    _autoRetryCount < MAX_AUTO_RETRY_ROUNDS &&
    batchNumber < MAX_DISCOVERY_ROUNDS_PER_CITY;

  if (shouldAutoRetry) {
    reachabilityStats.autoRegenerated = true;
    const nextInternalExclude = mergeExcludeNames(
      internalExcludeNames,
      finalRows.map((row) => row.name)
    );
    return discoverActivities({
      ...input,
      _autoRetryCount: _autoRetryCount + 1,
      _internalExcludeNames: nextInternalExclude,
      _skipCache: true,
      _reachabilityStats: reachabilityStats,
    });
  }

  return { activities: finalRows, roundLimitReached: false, reachability: reachabilityStats };
}

function toDiscoveredActivityRow(
  row: {
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
    googlePlaceId: string | null;
    imageUrl: string | null;
    imageUrls: string[];
    lat: number | null;
    lng: number | null;
    decision: string | null;
    decidedAt: Date | null;
    assignedDay: number | null;
    assignedOrder: number | null;
  },
  city: CityStop
): DiscoveredActivityRow {
  const normalizedImageUrls =
    row.imageUrls && row.imageUrls.length > 0 ? row.imageUrls : row.imageUrl ? [row.imageUrl] : [];

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
    googlePlaceId: row.googlePlaceId ?? null,
    imageUrl: row.imageUrl ?? normalizedImageUrls[0] ?? null,
    imageUrls: normalizedImageUrls,
    lat: row.lat,
    lng: row.lng,
    reachableMinutes: computeReachableMinutes(city, row.lat, row.lng),
    decision: row.decision as DiscoveredActivityRow["decision"],
    decidedAt: row.decidedAt?.toISOString() ?? null,
    assignedDay: row.assignedDay,
    assignedOrder: row.assignedOrder,
  };
}

type ClaudeActivity = z.infer<typeof ClaudeDiscoverActivitySchema>;

function annotateReachability(activity: ClaudeActivity, city: CityStop) {
  const distanceKm = haversineDistanceKm(city.lat, city.lng, activity.lat, activity.lng);
  return {
    activity,
    reachable: isWithinReach(distanceKm),
    distanceKm,
  };
}

function partitionByReachability<
  T extends { id: string; name: string; lat: number | null; lng: number | null },
>(rows: T[], city: CityStop) {
  const reachableRows: T[] = [];
  const unreachableRows: T[] = [];
  for (const row of rows) {
    if (row.lat == null || row.lng == null) {
      unreachableRows.push(row);
      continue;
    }
    const distanceKm = haversineDistanceKm(city.lat, city.lng, row.lat, row.lng);
    if (isWithinReach(distanceKm)) {
      reachableRows.push(row);
    } else {
      unreachableRows.push(row);
    }
  }
  return { reachableRows, unreachableRows };
}

function mergeExcludeNames(base: string[], additions: string[]): string[] {
  if (additions.length === 0) return base;
  const next = new Set(base);
  for (const addition of additions) {
    if (addition) next.add(addition);
  }
  return Array.from(next);
}

function isWithinReach(distanceKm: number): boolean {
  return Number.isFinite(distanceKm) && distanceKm <= MAX_ACTIVITY_DISTANCE_KM;
}

function computeReachableMinutes(
  city: CityStop,
  lat: number | null,
  lng: number | null
): number | null {
  if (lat == null || lng == null) return null;
  const distanceKm = haversineDistanceKm(city.lat, city.lng, lat, lng);
  if (!isWithinReach(distanceKm)) return null;
  const minutes = distanceKmToMinutes(distanceKm, AVERAGE_CITY_DRIVE_SPEED_KMH);
  return Number.isFinite(minutes) ? minutes : null;
}

interface VerifiedActivity {
  activity: ClaudeActivity;
  canonicalPlaceName: string;
  placeId: string | null;
  verifiedLat: number | null;
  verifiedLng: number | null;
}

interface PlaceVerificationResult {
  verified: VerifiedActivity[];
  filteredNames: string[];
}

async function verifyActivitiesWithPlaces(
  activities: ClaudeActivity[],
  city: CityStop,
  signal?: AbortSignal
): Promise<PlaceVerificationResult> {
  if (activities.length === 0) {
    return { verified: [], filteredNames: [] };
  }

  const lookups = await Promise.all(
    activities.map(async (activity) => {
      const controller = new AbortController();
      const abortListener = () => controller.abort();
      if (signal) {
        signal.addEventListener("abort", abortListener, { once: true });
      }
      const timeout = setTimeout(() => controller.abort(), PLACE_VERIFICATION_TIMEOUT_MS);
      try {
        const searchName = activity.placeName ?? activity.name;
        const place = await findPlace(`${searchName} ${city.city}`, controller.signal);
        return { activity, place };
      } catch {
        return { activity, place: null };
      } finally {
        clearTimeout(timeout);
        if (signal) {
          signal.removeEventListener("abort", abortListener);
        }
      }
    })
  );

  const verified: VerifiedActivity[] = [];
  const filteredNames: string[] = [];

  for (const { activity, place } of lookups) {
    if (!place || !place.location) {
      filteredNames.push(activity.name);
      continue;
    }

    const distanceKm = haversineDistanceKm(
      city.lat,
      city.lng,
      place.location.lat,
      place.location.lng
    );
    if (!isWithinReach(distanceKm)) {
      filteredNames.push(activity.name);
      continue;
    }

    const canonicalPlaceName = place.displayName?.trim() || activity.placeName || activity.name;

    verified.push({
      activity,
      canonicalPlaceName,
      placeId: place.placeId ?? null,
      verifiedLat: place.location.lat,
      verifiedLng: place.location.lng,
    });
  }

  return { verified, filteredNames };
}

function buildGoogleMapsUrl(placeId: string | null, fallbackQuery: string): string {
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`;
  }
  return `https://maps.google.com/?q=${encodeURIComponent(fallbackQuery)}`;
}

function dedupeVerifiedActivities(entries: VerifiedActivity[]) {
  const seenPlaceIds = new Set<string>();
  const unique: VerifiedActivity[] = [];
  const duplicateNames: string[] = [];

  for (const entry of entries) {
    if (entry.placeId && seenPlaceIds.has(entry.placeId)) {
      duplicateNames.push(entry.activity.name);
      continue;
    }
    if (entry.placeId) {
      seenPlaceIds.add(entry.placeId);
    }
    unique.push(entry);
  }

  return { unique, duplicateNames };
}
