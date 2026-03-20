// ============================================================
// Travel Pro — Amadeus OAuth2 Client
//
// Shared auth + base URL used by the hotel search client.
// Flight search has been migrated to SerpApi (Google Flights).
// Docs: https://developers.amadeus.com/self-service
// ============================================================

import { Redis } from "@upstash/redis";
import { getErrorMessage } from "@/lib/utils/error";
import { createLogger } from "@/lib/core/logger";
import { getOptionalAmadeusEnv, getOptionalRedisEnv } from "@/lib/config/server-env";
import { AMADEUS_REQUEST_TIMEOUT_MS } from "@/lib/config/constants";

const log = createLogger("amadeus");

/** Combine an optional caller signal with a timeout signal. */
function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(AMADEUS_REQUEST_TIMEOUT_MS);
  if (!signal) return timeoutSignal;
  return AbortSignal.any([signal, timeoutSignal]);
}

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

export const AMADEUS_BASE =
  getOptionalAmadeusEnv()?.environment === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";

type AmadeusTokenResponse = {
  access_token: string;
  expires_in: number;
};

/** Safe Redis get — returns null on any error (auth, network, etc.) */
async function safeRedisGet<T>(redis: Redis, key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (e) {
    log.warn("Redis get failed, skipping cache", { key, error: getErrorMessage(e) });
    return null;
  }
}

/** Safe Redis set — silently ignores errors */
async function safeRedisSet(redis: Redis, key: string, ttl: number, value: unknown): Promise<void> {
  try {
    await redis.setex(key, ttl, value);
  } catch (e) {
    log.warn("Redis set failed, skipping cache", { key, error: getErrorMessage(e) });
  }
}

/** Get a cached Amadeus OAuth2 bearer token. */
export async function getToken(signal?: AbortSignal): Promise<string> {
  const redis = getRedis();
  if (redis) {
    const cached = await safeRedisGet<string>(redis, "amadeus:token");
    if (cached) return cached;
  }

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: getOptionalAmadeusEnv()?.apiKey ?? "",
      client_secret: getOptionalAmadeusEnv()?.apiSecret ?? "",
    }).toString(),
    signal: withTimeout(signal),
  });

  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status}`);
  }

  const data = (await res.json()) as AmadeusTokenResponse;
  if (redis) {
    await safeRedisSet(
      redis,
      "amadeus:token",
      Math.max(data.expires_in - 60, 60),
      data.access_token
    );
  }
  return data.access_token;
}
