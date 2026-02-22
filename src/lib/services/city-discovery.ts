// ============================================================
// Travel Pro — City Discovery Service
// Detects cities from AI output that aren't in the static CITIES
// array and persists them to the discovered_cities table.
// ============================================================
import { prisma } from "@/lib/db/prisma";
import { CITIES } from "@/data/cities";
import { createLogger } from "@/lib/logger";
import type { CityStop } from "@/types";

const log = createLogger("city-discovery");

// O(1) lookup set. Key: "cityname|countrycode" (lowercased).
const knownCityKeys = new Set(
  CITIES.map((c) => `${c.city.toLowerCase()}|${c.countryCode.toLowerCase()}`)
);

/**
 * Check AI-generated route cities against the known CITIES array.
 * Unknown cities are upserted into the discovered_cities table.
 * Best-effort and non-blocking — callers should fire-and-forget.
 */
export async function discoverNewCities(
  route: CityStop[],
  tripId?: string
): Promise<void> {
  const unknowns = route.filter(
    (stop) =>
      !knownCityKeys.has(
        `${stop.city.toLowerCase()}|${stop.countryCode.toLowerCase()}`
      )
  );

  if (unknowns.length === 0) return;

  log.info("Discovered unknown cities from AI output", {
    count: unknowns.length,
    cities: unknowns.map((u) => `${u.city}, ${u.country}`),
    tripId,
  });

  const promises = unknowns.map((stop) =>
    prisma.discoveredCity
      .upsert({
        where: {
          city_country_unique: {
            city: stop.city,
            countryCode: stop.countryCode,
          },
        },
        create: {
          city: stop.city,
          country: stop.country,
          countryCode: stop.countryCode,
          lat: stop.lat,
          lng: stop.lng,
          firstTripId: tripId,
          timesProposed: 1,
        },
        update: {
          timesProposed: { increment: 1 },
        },
      })
      .catch((err) => {
        log.warn("Failed to upsert discovered city", {
          city: stop.city,
          error: err instanceof Error ? err.message : String(err),
        });
      })
  );

  await Promise.all(promises);
}
