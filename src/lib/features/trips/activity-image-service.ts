import { createLogger } from "@/lib/core/logger";
import { prisma } from "@/lib/core/prisma";
import { findPlace, getPlacePhotoUrl } from "@/lib/google-places/client";

const log = createLogger("activity-image-service");

const PER_REQUEST_TIMEOUT_MS = 3_000;

/**
 * Resolve Google Places photos for a batch of activities in a given city.
 * Returns an array of photo URLs (or null for misses), in the same order as the input.
 * All lookups run in parallel; individual failures never block the batch.
 */
export async function resolveActivityImages(
  activities: { name: string }[],
  city: string,
  signal?: AbortSignal
): Promise<(string | null)[]> {
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
        if (!place?.photoName) return null;
        return getPlacePhotoUrl(place.photoName, 400);
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

  const urls = results.map((r) => (r.status === "fulfilled" ? r.value : null));

  const perActivity = activities.map((a, i) => ({
    index: i,
    name: a.name,
    hasImage: urls[i] != null,
    status: results[i].status,
    reason:
      results[i].status === "rejected"
        ? String((results[i] as PromiseRejectedResult).reason)
        : undefined,
  }));

  const hits = urls.filter(Boolean).length;
  log.info("Activity image resolution complete", {
    city,
    total: activities.length,
    hits,
    missRate: `${(((activities.length - hits) / activities.length) * 100).toFixed(0)}%`,
    durationMs: Date.now() - t0,
    signalAbortedAtEnd: signal?.aborted ?? false,
    perActivity,
  });

  return urls;
}

/**
 * Resolve images for a batch of activities on demand.
 * Checks DB first — returns cached URLs for already-resolved activities.
 * For the rest, resolves via Google Places in parallel, updates DB rows, and returns all URLs.
 * Returns a map of activityId → imageUrl (null if resolution failed).
 */
export async function resolveActivityImagesBatch(
  activityIds: string[]
): Promise<Record<string, string | null>> {
  const rows = await prisma.discoveredActivity.findMany({
    where: { id: { in: activityIds } },
    select: { id: true, name: true, placeName: true, city: true, imageUrl: true },
  });

  const result: Record<string, string | null> = {};
  const needsResolution: typeof rows = [];

  for (const row of rows) {
    if (row.imageUrl) {
      result[row.id] = row.imageUrl;
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
        if (!place?.photoName) return { id: row.id, imageUrl: null };

        const imageUrl = getPlacePhotoUrl(place.photoName, 400);
        await prisma.discoveredActivity.update({
          where: { id: row.id },
          data: { imageUrl },
        });

        return { id: row.id, imageUrl };
      } catch {
        return { id: row.id, imageUrl: null };
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  for (const entry of resolved) {
    if (entry.status === "fulfilled") {
      result[entry.value.id] = entry.value.imageUrl;
    }
  }

  // Fill in any IDs that weren't found in DB at all
  for (const id of activityIds) {
    if (!(id in result)) {
      result[id] = null;
    }
  }

  return result;
}
