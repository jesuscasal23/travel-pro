/**
 * Sync legacy src/data/cities.ts entries into the new City table.
 *
 * Usage: npm run db:seed:cities
 */
import { PrismaClient } from "@prisma/client";
import { CITIES } from "@/data/cities";

const prisma = new PrismaClient();

function slugifyCity(city: string, countryCode: string): string {
  return `${city}-${countryCode}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log(`Syncing ${CITIES.length} cities into the database...`);
  const data = CITIES.map((entry) => ({
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

  const result = await prisma.city.createMany({ data, skipDuplicates: true });
  console.log(`Inserted ${result.count} new cities. Existing entries left untouched.`);
}

main()
  .catch((err) => {
    console.error("Failed to sync city catalog", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
