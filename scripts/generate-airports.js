#!/usr/bin/env node
/**
 * Generate src/data/airports-full.ts from OurAirports airports.csv
 *
 * Usage:
 *   1. Download airports.csv from https://ourairports.com/data/
 *   2. Place it in the project root as airports.csv
 *   3. node scripts/generate-airports.js
 */

const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "..", "airports.csv");
const outPath = path.join(__dirname, "..", "src", "data", "airports-full.ts");

if (!fs.existsSync(csvPath)) {
  console.error("airports.csv not found. Download from https://ourairports.com/data/");
  process.exit(1);
}

const content = fs.readFileSync(csvPath, "utf8");
const lines = content.split("\n");
const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

const typeIdx = header.indexOf("type");
const nameIdx = header.indexOf("name");
const iataIdx = header.indexOf("iata_code");
const countryIdx = header.indexOf("iso_country");
const municipalityIdx = header.indexOf("municipality");

const airports = [];

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const row = [];
  let inQuote = false,
    cur = "";
  for (const ch of lines[i]) {
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      row.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  row.push(cur);

  const type = row[typeIdx]?.trim();
  const iata = row[iataIdx]?.trim();
  if (type !== "large_airport" || !iata) continue;

  airports.push({
    iata,
    name: row[nameIdx]?.trim() || "",
    city: row[municipalityIdx]?.trim() || "",
    country: row[countryIdx]?.trim() || "",
  });
}

airports.sort((a, b) => a.iata.localeCompare(b.iata));

const ts = `// Auto-generated from OurAirports data (large airports with IATA codes)
// Source: https://ourairports.com/data/ — public domain
// ${airports.length} airports worldwide
// Run scripts/generate-airports.js to regenerate from a fresh airports.csv

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
}

export const AIRPORTS: Airport[] = ${JSON.stringify(airports, null, 2)};
`;

fs.writeFileSync(outPath, ts, "utf8");
console.log(`Written ${airports.length} airports to src/data/airports-full.ts`);
