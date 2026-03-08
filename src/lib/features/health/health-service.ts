import { getOptionalRedisEnv, getServerEnvChecks } from "@/lib/config/server-env";

export async function getHealthStatus() {
  const checks = getServerEnvChecks();

  const redisEnv = getOptionalRedisEnv();
  if (checks.redis === "ok" && redisEnv) {
    try {
      const response = await fetch(`${redisEnv.url}/ping`, {
        headers: { Authorization: `Bearer ${redisEnv.token}` },
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) {
        checks.redis = "unreachable";
      }
    } catch {
      checks.redis = "unreachable";
    }
  }

  const healthy = Object.values(checks).every((status) => status === "ok");
  return {
    healthy,
    checks,
  };
}
