// ============================================================
// Travel Pro — Amadeus Hotel Search Client
// Docs: https://developers.amadeus.com/self-service
// ============================================================

import { Redis } from "@upstash/redis";
import { getToken, AMADEUS_BASE } from "@/lib/flights/amadeus";
import { getOptionalAmadeusEnv, getOptionalRedisEnv } from "@/lib/config/server-env";
import { getErrorMessage } from "@/lib/utils/error";
import { createLogger } from "@/lib/core/logger";
import type { AmadeusHotelEntry, AmadeusHotelOffer, HotelCandidate } from "./types";

const log = createLogger("hotels");

let _redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const redisEnv = getOptionalRedisEnv();
  if (!redisEnv) {
    _redis = null;
    return null;
  }
  _redis = new Redis(redisEnv);
  return _redis;
}

const CACHE_TTL = 4 * 60 * 60; // 4 hours

/**
 * Search hotels by city IATA code.
 * Returns up to 20 hotels (3-5 star) near the city center.
 */
export async function searchHotelsByCity(cityCode: string): Promise<AmadeusHotelEntry[] | null> {
  if (!getOptionalAmadeusEnv()) {
    log.warn("Amadeus credentials missing — skipping hotel search", { cityCode });
    return null;
  }

  const redis = getRedis();
  const cacheKey = `hotels:list:${cityCode}`;
  if (redis) {
    const cached = await redis.get<AmadeusHotelEntry[]>(cacheKey);
    if (cached) return cached;
  }

  let token: string;
  try {
    token = await getToken();
  } catch (e) {
    log.warn("Token fetch failed", { error: getErrorMessage(e) });
    return null;
  }

  const params = new URLSearchParams({
    cityCode,
    ratings: "3,4,5",
    radius: "15",
    radiusUnit: "KM",
  });

  let res: Response;
  try {
    res = await fetch(`${AMADEUS_BASE}/v1/reference-data/locations/hotels/by-city?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    log.warn("Network error searching hotels", { error: getErrorMessage(e) });
    return null;
  }

  if (!res.ok) {
    log.warn("Hotel list search failed", { cityCode, status: res.status });
    return null;
  }

  const body = (await res.json()) as { data?: AmadeusHotelEntry[] };
  const hotels = body.data?.slice(0, 20) ?? [];

  if (redis && hotels.length > 0) {
    await redis.setex(cacheKey, CACHE_TTL, hotels);
  }

  return hotels;
}

/**
 * Get hotel offers (prices) for a list of hotel IDs.
 * Amadeus limits to 20 hotel IDs per request.
 */
export async function searchHotelOffers(
  hotelIds: string[],
  checkIn: string,
  checkOut: string,
  adults: number
): Promise<AmadeusHotelOffer[] | null> {
  if (!getOptionalAmadeusEnv()) {
    log.warn("Amadeus credentials missing — skipping hotel offers search");
    return null;
  }
  if (hotelIds.length === 0) return null;

  const ids = hotelIds.slice(0, 20);
  const redis = getRedis();
  const cacheKey = `hotels:offers:${ids.join(",")}:${checkIn}:${checkOut}:${adults}`;
  if (redis) {
    const cached = await redis.get<AmadeusHotelOffer[]>(cacheKey);
    if (cached) return cached;
  }

  let token: string;
  try {
    token = await getToken();
  } catch (e) {
    log.warn("Token fetch failed", { error: getErrorMessage(e) });
    return null;
  }

  const params = new URLSearchParams({
    hotelIds: ids.join(","),
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults: String(adults),
    currency: "EUR",
    bestRateOnly: "true",
  });

  let res: Response;
  try {
    res = await fetch(`${AMADEUS_BASE}/v3/shopping/hotel-offers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    log.warn("Network error searching hotel offers", { error: getErrorMessage(e) });
    return null;
  }

  if (!res.ok) {
    log.warn("Hotel offers search failed", { status: res.status });
    return null;
  }

  const body = (await res.json()) as { data?: AmadeusHotelOffer[] };
  const offers = body.data ?? [];

  if (redis && offers.length > 0) {
    await redis.setex(cacheKey, CACHE_TTL, offers);
  }

  return offers;
}

/**
 * Build hotel candidates from Amadeus hotel list + offers.
 * Merges price data from offers with hotel metadata.
 */
export function buildCandidates(
  hotels: AmadeusHotelEntry[],
  offers: AmadeusHotelOffer[] | null,
  nights: number
): HotelCandidate[] {
  const offerMap = new Map<string, AmadeusHotelOffer>();
  if (offers) {
    for (const o of offers) {
      if (o.available && o.offers.length > 0) {
        offerMap.set(o.hotel.hotelId, o);
      }
    }
  }

  return hotels
    .map((h) => {
      const offer = offerMap.get(h.hotelId);
      const totalPrice = offer ? parseFloat(offer.offers[0].price.total) : undefined;
      const pricePerNight = totalPrice && nights > 0 ? Math.round(totalPrice / nights) : undefined;
      const currency = offer?.offers[0].price.currency ?? "EUR";

      return {
        hotelId: h.hotelId,
        name: h.name,
        rating: h.rating,
        pricePerNight,
        totalPrice,
        currency,
        address: offer?.hotel.address?.lines?.join(", "),
        distance: h.distance ? `${h.distance.value} ${h.distance.unit}` : undefined,
      } satisfies HotelCandidate;
    })
    .filter((c) => c.pricePerNight != null) // only include hotels with prices
    .sort((a, b) => (a.pricePerNight ?? Infinity) - (b.pricePerNight ?? Infinity));
}
