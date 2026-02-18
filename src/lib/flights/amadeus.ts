// ============================================================
// Travel Pro — Amadeus Self-Service Flight Search Client
// Docs: https://developers.amadeus.com/self-service
// ============================================================

import { Redis } from "@upstash/redis";
import type { FlightOption } from "./types";

let _redis: Redis | undefined;

function getRedis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

const AMADEUS_BASE =
  process.env.AMADEUS_ENVIRONMENT === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

type AmadeusTokenResponse = {
  access_token: string;
  expires_in: number;
};

type AmadeusFlightOffer = {
  price: { total: string };
  itineraries: Array<{ duration: string }>;
  validatingAirlineCodes: string[];
};

/** Parse ISO 8601 duration (PT12H30M) → human-readable ("12h 30m"). */
function parseDuration(iso: string): string {
  const h = iso.match(/(\d+)H/)?.[1];
  const m = iso.match(/(\d+)M/)?.[1];
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  if (m) return `${m}m`;
  return iso;
}

/** Get a cached Amadeus OAuth2 bearer token. */
async function getToken(): Promise<string> {
  const redis = getRedis();
  const cached = await redis.get<string>("amadeus:token");
  if (cached) return cached;

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_API_KEY ?? "",
      client_secret: process.env.AMADEUS_API_SECRET ?? "",
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status}`);
  }

  const data = (await res.json()) as AmadeusTokenResponse;
  await redis.setex(
    "amadeus:token",
    Math.max(data.expires_in - 60, 60),
    data.access_token
  );
  return data.access_token;
}

/**
 * Search for the cheapest flight between two IATA codes on a given date.
 * Returns null when Amadeus is not configured, unavailable, or no flights found.
 * Results are cached in Redis for 2 hours.
 */
export async function searchFlights(
  origin: string,
  destination: string,
  date: string, // YYYY-MM-DD
  adults: number
): Promise<FlightOption | null> {
  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    return null;
  }

  const redis = getRedis();
  const cacheKey = `flights:${origin}:${destination}:${date}:${adults}`;
  const cached = await redis.get<FlightOption>(cacheKey);
  if (cached) return cached;

  let token: string;
  try {
    token = await getToken();
  } catch (e) {
    console.warn(
      "[amadeus] Token fetch failed:",
      e instanceof Error ? e.message : e
    );
    return null;
  }

  const params = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: date,
    adults: String(adults),
    max: "5",
    currencyCode: "EUR",
  });

  let res: Response;
  try {
    res = await fetch(`${AMADEUS_BASE}/v2/shopping/flight-offers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    console.warn(
      "[amadeus] Network error:",
      e instanceof Error ? e.message : e
    );
    return null;
  }

  if (!res.ok) {
    console.warn(
      `[amadeus] ${origin}→${destination} on ${date}: HTTP ${res.status}`
    );
    return null;
  }

  const body = (await res.json()) as { data?: AmadeusFlightOffer[] };
  if (!body.data?.length) return null;

  const best = body.data[0];
  const option: FlightOption = {
    price: parseFloat(best.price.total),
    duration: parseDuration(best.itineraries[0]?.duration ?? ""),
    airline: best.validatingAirlineCodes[0] ?? "?",
  };

  await redis.setex(cacheKey, 7200, option);
  return option;
}
