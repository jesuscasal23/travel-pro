import { createLogger } from "@/lib/core/logger";

const log = createLogger("google-places-client");

let warnedMissingKey = false;

function getApiKey(): string | null {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    if (!warnedMissingKey) {
      log.warn("GOOGLE_PLACES_API_KEY is not set — activity images will be unavailable");
      warnedMissingKey = true;
    }
    return null;
  }
  return key;
}

interface FindPlaceResult {
  placeId: string;
  photoNames: string[];
  location?: { lat: number; lng: number } | null;
  displayName?: string | null;
}

/**
 * Search for a place by text query and return its ID + first photo reference.
 * Returns null on any failure (images are non-critical).
 */
export async function findPlace(
  query: string,
  signal?: AbortSignal
): Promise<FindPlaceResult | null> {
  const key = getApiKey();
  if (!key) return null;

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.photos,places.location,places.displayName",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
      signal,
    });

    if (!response.ok) {
      log.warn("Places API search failed", {
        status: response.status,
        query,
      });
      return null;
    }

    const data = (await response.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        photos?: Array<{ name: string }>;
        location?: { latitude?: number; longitude?: number };
      }>;
    };

    const place = data.places?.[0];
    if (!place) return null;

    const photoNames = (place.photos ?? []).map((photo) => photo.name).filter(Boolean);
    const location =
      place.location &&
      typeof place.location.latitude === "number" &&
      typeof place.location.longitude === "number"
        ? { lat: place.location.latitude, lng: place.location.longitude }
        : null;
    return {
      placeId: place.id,
      photoNames,
      location,
      displayName: place.displayName?.text ?? null,
    };
  } catch (error) {
    if (signal?.aborted) return null;
    log.warn("Places API search error", { query, error });
    return null;
  }
}

/**
 * Build a proxied photo URL that routes through our API.
 * This keeps the Google API key server-side and avoids CSP issues.
 */
export function getPlacePhotoUrl(photoName: string, maxWidth: number = 400): string {
  return `/api/v1/places/photo?ref=${encodeURIComponent(photoName)}&w=${maxWidth}`;
}
