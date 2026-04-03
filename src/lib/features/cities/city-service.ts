import type { City } from "@prisma/client";
import { prisma } from "@/lib/core/prisma";
import { createLogger } from "@/lib/core/logger";
import type { CityRecord } from "@/types";
import type { CityEntry } from "@/data/cities";

const log = createLogger("cities:service");

function slugifyCity(city: string, countryCode: string): string {
  return `${city}-${countryCode}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapCityRow(row: City): CityRecord {
  return {
    id: row.id,
    slug: row.slug,
    city: row.city,
    country: row.country,
    countryCode: row.countryCode,
    lat: row.lat,
    lng: row.lng,
    region: row.region ?? undefined,
    iataCode: row.iataCode ?? undefined,
    popular: row.popular,
  };
}

function mapLegacyEntry(entry: CityEntry): CityRecord {
  const slug = slugifyCity(entry.city, entry.countryCode);
  return {
    id: `legacy-${slug}`,
    slug,
    city: entry.city,
    country: entry.country,
    countryCode: entry.countryCode,
    lat: entry.lat,
    lng: entry.lng,
    popular: Boolean(entry.popular),
  };
}

async function seedCitiesFromLegacy(): Promise<void> {
  const { CITIES } = await import("@/data/cities");
  if (CITIES.length === 0) return;

  const payload = CITIES.map((entry) => ({
    slug: slugifyCity(entry.city, entry.countryCode),
    city: entry.city,
    country: entry.country,
    countryCode: entry.countryCode,
    lat: entry.lat,
    lng: entry.lng,
    region: null,
    iataCode: null,
    popular: Boolean(entry.popular),
  }));

  await prisma.city.createMany({ data: payload, skipDuplicates: true });
}

async function fetchCitiesFromDatabase(): Promise<CityRecord[] | null> {
  try {
    let rows = await prisma.city.findMany({
      orderBy: [{ popular: "desc" }, { city: "asc" }],
    });

    if (rows.length === 0) {
      await seedCitiesFromLegacy();
      rows = await prisma.city.findMany({
        orderBy: [{ popular: "desc" }, { city: "asc" }],
      });
    }

    if (rows.length === 0) return [];
    return rows.map(mapCityRow);
  } catch (error) {
    log.warn("Falling back to legacy city data", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function loadLegacyCities(): Promise<CityRecord[]> {
  const { CITIES } = await import("@/data/cities");
  return CITIES.map(mapLegacyEntry);
}

export async function listCities(): Promise<CityRecord[]> {
  const dbResult = await fetchCitiesFromDatabase();
  if (dbResult && dbResult.length > 0) {
    return dbResult;
  }
  return loadLegacyCities();
}
