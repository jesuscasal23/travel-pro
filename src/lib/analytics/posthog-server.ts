import { createLogger } from "@/lib/core/logger";
import { getOptionalPosthogServerEnv } from "@/lib/config/server-env";

const log = createLogger("posthog-server");

export async function captureServerEvent(
  event: string,
  properties?: Record<string, unknown>,
  distinctId?: string
): Promise<void> {
  const env = getOptionalPosthogServerEnv();
  if (!env) {
    log.debug("Skipped PostHog capture — POSTHOG_API_KEY missing", { event });
    return;
  }

  try {
    await fetch(`${env.host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.apiKey,
        event,
        distinct_id: distinctId ?? "server",
        properties: {
          ...(properties ?? {}),
          channel: "server",
        },
      }),
    });
  } catch (error) {
    log.error("Failed to send PostHog event", {
      event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
