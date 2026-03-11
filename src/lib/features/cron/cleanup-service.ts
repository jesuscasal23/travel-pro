import { UnauthorizedError } from "@/lib/api/errors";
import { getCronSecret } from "@/lib/config/server-env";
import { cleanupStaleGenerations } from "@/lib/features/trips/itinerary-service";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("cron-cleanup-service");

export async function runStaleGenerationCleanup(authorizationHeader: string | null) {
  const cronSecret = getCronSecret();
  if (authorizationHeader !== `Bearer ${cronSecret}`) {
    log.warn("Unauthorized cron attempt");
    throw new UnauthorizedError();
  }

  const cleaned = await cleanupStaleGenerations();
  log.info("Cron cleanup completed", { cleaned });
  return { ok: true as const, cleaned };
}
