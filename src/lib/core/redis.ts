import { Redis } from "@upstash/redis";
import { getOptionalRedisEnv } from "@/lib/config/server-env";

let _redis: Redis | null | undefined;

/**
 * Lazy-initialized shared Redis client.
 * Returns null when Redis env vars are not configured.
 */
export function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const env = getOptionalRedisEnv();
  if (!env) {
    _redis = null;
    return null;
  }
  _redis = new Redis(env);
  return _redis;
}
