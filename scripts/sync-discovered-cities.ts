/**
 * Sync discovered cities from DB into src/data/cities.ts.
 *
 * Usage:
 *   npx tsx scripts/sync-discovered-cities.ts              # dry-run (default)
 *   npx tsx scripts/sync-discovered-cities.ts --write       # actually modify cities.ts
 *   npx tsx scripts/sync-discovered-cities.ts --all         # include unapproved (dry-run)
 *   npx tsx scripts/sync-discovered-cities.ts --all --write # include unapproved + write
 *
 * Requires DATABASE_URL in .env.local.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const CITIES_FILE = resolve(__dirname, "../src/data/cities.ts");

async function main() {
  const args = process.argv.slice(2);
  const shouldWrite = args.includes("--write");
  const includeAll = args.includes("--all");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set. Add it to .env.local.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const where = includeAll ? {} : { approved: true };
    const discovered = await prisma.discoveredCity.findMany({
      where,
      orderBy: [{ timesProposed: "desc" }, { city: "asc" }],
    });

    if (discovered.length === 0) {
      console.log(
        includeAll
          ? "No discovered cities in the database."
          : "No approved discovered cities. Use --all to include unapproved."
      );
      return;
    }

    // Build dedup set from current cities.ts
    const citiesContent = readFileSync(CITIES_FILE, "utf-8");
    const existingKeys = new Set<string>();
    const entryRegex = /city:\s*"([^"]+)".*?countryCode:\s*"([^"]+)"/g;
    let match;
    while ((match = entryRegex.exec(citiesContent)) !== null) {
      existingKeys.add(`${match[1].toLowerCase()}|${match[2].toLowerCase()}`);
    }

    const newCities = discovered.filter(
      (d) => !existingKeys.has(`${d.city.toLowerCase()}|${d.countryCode.toLowerCase()}`)
    );

    if (newCities.length === 0) {
      console.log("All discovered cities already exist in cities.ts.");
      return;
    }

    console.log(`\nFound ${newCities.length} new cities to add:\n`);
    for (const c of newCities) {
      console.log(`  ${c.city}, ${c.country} (${c.countryCode}) — proposed ${c.timesProposed}x`);
    }

    if (!shouldWrite) {
      console.log("\nDry run — pass --write to modify cities.ts");
      return;
    }

    // Build TypeScript lines
    const newLines = newCities.map(
      (c) =>
        `  { city: "${c.city}", country: "${c.country}", countryCode: "${c.countryCode}", lat: ${c.lat}, lng: ${c.lng} },`
    );

    // Insert before the closing ];
    const closingIndex = citiesContent.lastIndexOf("];");
    if (closingIndex === -1) {
      console.error("Could not find closing ]; in cities.ts");
      process.exit(1);
    }

    const before = citiesContent.slice(0, closingIndex);
    const after = citiesContent.slice(closingIndex);
    const dateStr = new Date().toISOString().split("T")[0];
    const separator = `\n  // ── AI-Discovered Cities (synced ${dateStr}) ──\n`;
    const updated = before + separator + newLines.join("\n") + "\n" + after;

    writeFileSync(CITIES_FILE, updated, "utf-8");
    console.log(`\nWrote ${newCities.length} cities to cities.ts`);

    // Mark synced cities as approved
    const syncedIds = newCities.map((c) => c.id);
    await prisma.discoveredCity.updateMany({
      where: { id: { in: syncedIds } },
      data: { approved: true },
    });
    console.log("Marked synced cities as approved in DB.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
