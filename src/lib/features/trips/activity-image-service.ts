import { createLogger } from "@/lib/core/logger";
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

  const results = await Promise.allSettled(
    activities.map(async (activity) => {
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
      }
    })
  );

  const urls = results.map((r) => (r.status === "fulfilled" ? r.value : null));

  const hits = urls.filter(Boolean).length;
  log.info("Activity image resolution complete", {
    city,
    total: activities.length,
    hits,
    missRate: `${(((activities.length - hits) / activities.length) * 100).toFixed(0)}%`,
    durationMs: Date.now() - t0,
  });

  return urls;
}
