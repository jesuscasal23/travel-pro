// ============================================================
// Health Enrichment — static dataset lookup
// ============================================================

import type { CityStop, HealthInfo } from "@/types";
import { HEALTH_REQUIREMENTS } from "@/data/health-requirements";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("enrichment:health");

/**
 * Enrich health/vaccine data for each unique country in the route.
 * Uses the static health-requirements dataset (CDC/WHO-sourced).
 */
export async function enrichHealth(route: CityStop[]): Promise<HealthInfo[]> {
  const t0 = Date.now();

  // Deduplicate by countryCode
  const seen = new Set<string>();
  const uniqueCountries = route.filter((stop) => {
    if (seen.has(stop.countryCode)) return false;
    seen.add(stop.countryCode);
    return true;
  });

  log.info("enrichHealth: starting", {
    routeCities: route.length,
    uniqueCountries: uniqueCountries.length,
    countries: uniqueCountries.map((s) => s.countryCode),
  });

  const results: HealthInfo[] = uniqueCountries.map((stop) => ({
    country: stop.country,
    countryCode: stop.countryCode,
    requirements: HEALTH_REQUIREMENTS[stop.countryCode] ?? [],
  }));

  log.info("enrichHealth: complete", {
    duration: `${Date.now() - t0}ms`,
    resultCount: results.length,
    results: results.map((r) => ({
      country: r.country,
      countryCode: r.countryCode,
      requirementCount: r.requirements.length,
      hasRequired: r.requirements.some((req) => req.type === "required"),
    })),
  });

  return results;
}
