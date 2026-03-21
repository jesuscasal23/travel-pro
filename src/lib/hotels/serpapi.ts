// ============================================================
// Travel Pro — SerpApi Google Hotels Client
//
// Uses Google Hotels data via SerpApi for accurate consumer-facing
// prices. Booking links fall back to Booking.com affiliate links.
// Docs: https://serpapi.com/google-hotels-api
// ============================================================

import type { SerpApiHotelsResponse, SerpApiHotelProperty, HotelCandidate } from "./types";
import { getErrorMessage } from "@/lib/utils/error";
import { createLogger } from "@/lib/core/logger";
import { SERPAPI_REQUEST_TIMEOUT_MS } from "@/lib/config/constants";

const log = createLogger("serpapi:hotels");

const SERPAPI_BASE = "https://serpapi.com/search";

export class SerpApiHotelRateLimitError extends Error {
  constructor() {
    super("Hotel search is busy — please try again in a moment.");
    this.name = "SerpApiHotelRateLimitError";
  }
}

// ── Helpers ─────────────────────────────────────────────────

/** Generate a stable ID from hotel name (SerpApi doesn't provide IDs). */
function generateHotelId(name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `serp-${slug}-${index}`;
}

/** Extract nearest landmark distance from nearby_places. */
function extractDistance(property: SerpApiHotelProperty): string | undefined {
  const place = property.nearby_places?.[0];
  const transport = place?.transportations?.[0];
  if (place && transport) {
    return `${transport.duration} ${transport.type} to ${place.name}`;
  }
  return undefined;
}

// ── Main Search ─────────────────────────────────────────────

/**
 * Search for hotels in a city for given dates.
 * Returns up to 20 hotel candidates with prices, ratings, and amenities.
 * Returns [] when SerpApi is unavailable or no hotels found.
 */
export async function searchHotels(
  apiKey: string,
  city: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  filters?: { minStars?: number; maxPrice?: number; currency?: string },
  signal?: AbortSignal
): Promise<HotelCandidate[]> {
  const currency = filters?.currency ?? "EUR";

  const params = new URLSearchParams({
    engine: "google_hotels",
    api_key: apiKey,
    q: `hotels in ${city}`,
    check_in_date: checkIn,
    check_out_date: checkOut,
    adults: String(adults),
    currency,
    sort_by: "8", // lowest price
    hl: "en",
    gl: "us",
  });

  if (filters?.minStars) {
    params.set("hotel_class", String(filters.minStars));
  }
  if (filters?.maxPrice) {
    params.set("max_price", String(filters.maxPrice));
  }

  let res: Response;
  try {
    res = await fetch(`${SERPAPI_BASE}?${params}`, {
      signal: AbortSignal.any([
        AbortSignal.timeout(SERPAPI_REQUEST_TIMEOUT_MS),
        ...(signal ? [signal] : []),
      ]),
    });
  } catch (e) {
    log.warn("Network error", { error: getErrorMessage(e), city });
    return [];
  }

  if (res.status === 429) {
    log.warn("SerpApi rate limit hit", { city });
    throw new SerpApiHotelRateLimitError();
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "(unreadable)");
    log.warn("SerpApi hotel search failed", {
      city,
      status: res.status,
      body: errorBody.slice(0, 500),
    });
    return [];
  }

  const body = (await res.json()) as SerpApiHotelsResponse;

  // Log full response shape for diagnostics
  log.info("SerpApi hotels response", {
    city,
    hasError: !!body.error,
    error: body.error ?? null,
    propertiesCount: body.properties?.length ?? 0,
    topLevelKeys: Object.keys(body).join(", "),
  });

  if (body.error) {
    log.warn("SerpApi returned error", { error: body.error, city });
    return [];
  }

  const properties = body.properties ?? [];
  if (properties.length === 0) {
    log.warn("No hotel properties returned", { city, responseKeys: Object.keys(body).join(", ") });
    return [];
  }

  // Track how many properties have direct booking links
  const withLink = properties.filter((p) => !!p.link).length;
  const withPrice = properties.filter(
    (p) => p.rate_per_night?.extracted_lowest || p.total_rate?.extracted_lowest
  ).length;
  log.info("Hotel properties breakdown", {
    city,
    total: properties.length,
    withDirectLink: withLink,
    withoutDirectLink: properties.length - withLink,
    withPrice,
    sampleLink: properties.find((p) => p.link)?.link?.slice(0, 150) ?? null,
    sampleWithoutLink: properties.find((p) => !p.link)?.name ?? null,
  });

  // Compute nights for per-night price calculation
  const nights = Math.max(
    1,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  );

  const candidates: HotelCandidate[] = properties
    .map((p, i) => mapPropertyToCandidate(p, i, currency, nights))
    .filter((c): c is HotelCandidate => c !== null);

  // Apply star filter client-side (SerpApi hotel_class is minimum, but double-check).
  // Properties without a star rating (hotel_class) pass through — SerpApi already
  // filters server-side, so missing rating doesn't mean low quality.
  const filtered = filters?.minStars
    ? candidates.filter((c) => c.rating === undefined || c.rating >= filters.minStars!)
    : candidates;

  const withRating = candidates.filter((c) => c.rating !== undefined).length;
  const droppedByFilter = candidates.length - filtered.length;
  log.info("Hotel search complete", {
    city,
    total: properties.length,
    candidates: candidates.length,
    withStarRating: withRating,
    withoutStarRating: candidates.length - withRating,
    droppedByMinStarsFilter: droppedByFilter,
    afterFilter: filtered.length,
    withPrices: filtered.filter((c) => c.pricePerNight).length,
  });

  return filtered.slice(0, 20);
}

/** Map a SerpApi property to our internal HotelCandidate. */
function mapPropertyToCandidate(
  p: SerpApiHotelProperty,
  index: number,
  currency: string,
  nights: number
): HotelCandidate | null {
  // Skip properties without a name
  if (!p.name) return null;

  const totalPrice = p.total_rate?.extracted_lowest ?? p.total_rate?.extracted_before_taxes_fees;
  const ratePerNight =
    p.rate_per_night?.extracted_lowest ?? p.rate_per_night?.extracted_before_taxes_fees;

  const pricePerNight = ratePerNight ?? (totalPrice ? Math.round(totalPrice / nights) : undefined);
  const computedTotal = totalPrice ?? (ratePerNight ? ratePerNight * nights : undefined);

  return {
    hotelId: generateHotelId(p.name, index),
    name: p.name,
    rating: p.hotel_class,
    pricePerNight,
    totalPrice: computedTotal,
    currency,
    distance: extractDistance(p),
    overallRating: p.overall_rating,
    reviewCount: p.reviews,
    amenities: p.amenities,
    thumbnail: p.images?.[0]?.thumbnail,
    link: p.link,
  };
}
