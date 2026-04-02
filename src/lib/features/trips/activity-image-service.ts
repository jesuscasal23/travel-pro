import { createLogger } from "@/lib/core/logger";
import { prisma } from "@/lib/core/prisma";
import { findPlace, getPlacePhotoUrl } from "@/lib/google-places/client";

const log = createLogger("activity-image-service");

const PER_REQUEST_TIMEOUT_MS = 3_000;

interface ActivityImageResolution {
  imageUrls: string[];
  verifiedLocation?: { lat: number; lng: number } | null;
}

const MAX_IMAGES_PER_ACTIVITY = 2;

/**
 * Resolve Google Places photos for a batch of activities in a given city.
 * Returns an array of image URL arrays (each entry capped at MAX_IMAGES_PER_ACTIVITY),
 * preserving the order of the input list. Individual failures never block the batch.
 */
export async function resolveActivityImages(
  activities: { name: string }[],
  city: string,
  signal?: AbortSignal
): Promise<ActivityImageResolution[]> {
  const t0 = Date.now();
  const signalAlreadyAborted = signal?.aborted ?? false;

  if (signalAlreadyAborted) {
    log.warn("Image resolution started with already-aborted signal", { city });
  }

  const results = await Promise.allSettled(
    activities.map(async (activity, index) => {
      const requestStart = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS);

      if (signal) {
        signal.addEventListener("abort", () => controller.abort(), { once: true });
      }

      try {
        const place = await findPlace(`${activity.name} ${city}`, controller.signal);
        const photoNames = place?.photoNames?.slice(0, MAX_IMAGES_PER_ACTIVITY) ?? [];
        const verifiedLocation = place?.location ?? null;
        if (photoNames.length === 0) {
          return { imageUrls: [], verifiedLocation };
        }
        const urls = photoNames.map((name) => getPlacePhotoUrl(name, 400));
        return { imageUrls: urls, verifiedLocation };
      } finally {
        clearTimeout(timeout);
        log.debug("Image request finished", {
          city,
          index,
          activity: activity.name,
          durationMs: Date.now() - requestStart,
          abortedBySignal: signal?.aborted ?? false,
          elapsedSinceBatchStart: Date.now() - t0,
        });
      }
    })
  );

  const resolutions: ActivityImageResolution[] = results.map((r) =>
    r.status === "fulfilled" ? r.value : { imageUrls: [], verifiedLocation: null }
  );

  const perActivity = activities.map((a, i) => ({
    index: i,
    name: a.name,
    hasPrimaryImage: resolutions[i].imageUrls.length > 0,
    status: results[i].status,
    reason:
      results[i].status === "rejected"
        ? String((results[i] as PromiseRejectedResult).reason)
        : undefined,
  }));

  const hits = resolutions.filter((r) => r.imageUrls.length > 0).length;
  const dualPhotoCount = resolutions.filter((r) => r.imageUrls.length >= 2).length;
  log.info("Activity image resolution complete", {
    city,
    total: activities.length,
    hits,
    dualPhotoCount,
    secondaryShortfall: Math.max(hits - dualPhotoCount, 0),
    missRate: `${(((activities.length - hits) / activities.length) * 100).toFixed(0)}%`,
    durationMs: Date.now() - t0,
    signalAbortedAtEnd: signal?.aborted ?? false,
    perActivity,
  });

  return resolutions;
}

/**
 * Resolve images for a batch of activities on demand.
 * Checks DB first — returns cached URLs for already-resolved activities.
 * For the rest, resolves via Google Places in parallel, updates DB rows, and returns all URLs.
 * Returns a map of activityId → imageUrl (null if resolution failed).
 */
export async function resolveActivityImagesBatch(
  activityIds: string[]
): Promise<Record<string, { imageUrl: string | null; imageUrls: string[] }>> {
  const rows = await prisma.discoveredActivity.findMany({
    where: { id: { in: activityIds } },
    select: { id: true, name: true, placeName: true, city: true, imageUrl: true, imageUrls: true },
  });

  const result: Record<string, { imageUrl: string | null; imageUrls: string[] }> = {};
  const needsResolution: typeof rows = [];

  for (const row of rows) {
    const normalizedUrls =
      row.imageUrls && row.imageUrls.length > 0
        ? row.imageUrls
        : row.imageUrl
          ? [row.imageUrl]
          : [];
    if (normalizedUrls.length > 0) {
      result[row.id] = { imageUrl: normalizedUrls[0] ?? null, imageUrls: normalizedUrls };
    } else {
      needsResolution.push(row);
    }
  }

  if (needsResolution.length === 0) return result;

  const resolved = await Promise.allSettled(
    needsResolution.map(async (row) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS);

      try {
        const searchName = row.placeName ?? row.name;
        const place = await findPlace(`${searchName} ${row.city}`, controller.signal);
        const photoNames = place?.photoNames?.slice(0, MAX_IMAGES_PER_ACTIVITY) ?? [];
        const verifiedLocation = place?.location ?? null;
        if (photoNames.length === 0) {
          if (verifiedLocation) {
            await prisma.discoveredActivity.update({
              where: { id: row.id },
              data: { lat: verifiedLocation.lat, lng: verifiedLocation.lng },
            });
          }
          return { id: row.id, imageUrls: [] };
        }

        const imageUrls = photoNames.map((name) => getPlacePhotoUrl(name, 400));
        const updateData = {
          imageUrl: imageUrls[0] ?? null,
          imageUrls,
          ...(verifiedLocation ? { lat: verifiedLocation.lat, lng: verifiedLocation.lng } : {}),
        };
        await prisma.discoveredActivity.update({
          where: { id: row.id },
          data: updateData,
        });

        return { id: row.id, imageUrls };
      } catch {
        return { id: row.id, imageUrls: [] };
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  for (const entry of resolved) {
    if (entry.status === "fulfilled") {
      result[entry.value.id] = {
        imageUrl: entry.value.imageUrls[0] ?? null,
        imageUrls: entry.value.imageUrls,
      };
    }
  }

  // Fill in any IDs that weren't found in DB at all
  for (const id of activityIds) {
    if (!(id in result)) {
      result[id] = { imageUrl: null, imageUrls: [] };
    }
  }

  return result;
}
