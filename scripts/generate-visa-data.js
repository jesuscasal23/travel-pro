#!/usr/bin/env node
/**
 * Fetch and generate src/data/visa-index.ts from Passport Index dataset.
 * Uses the ISO-2 tidy CSV format.
 *
 * Usage: node scripts/generate-visa-data.js
 * Requires: internet connection (fetches from GitHub raw)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const CSV_URL =
  "https://raw.githubusercontent.com/imorte/passport-index-data/main/passport-index-tidy-iso2.csv";
const OUT_PATH = path.join(__dirname, "..", "src", "data", "visa-index.ts");

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    });
  });
}

async function main() {
  console.log("Fetching Passport Index data...");
  const csv = await fetchText(CSV_URL);
  const lines = csv.trim().split("\n");
  const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

  const passportIdx = header.indexOf("Passport");
  const destIdx = header.indexOf("Destination");
  const reqIdx = header.indexOf("Requirement");

  if (passportIdx === -1 || destIdx === -1 || reqIdx === -1) {
    throw new Error("CSV format changed — update column names in script");
  }

  const index = {};
  let rows = 0;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(",").map((c) => c.replace(/"/g, "").trim());
    const passport = cols[passportIdx];
    const dest = cols[destIdx];
    const req = cols[reqIdx];
    if (!passport || !dest || !req) continue;
    if (!index[passport]) index[passport] = {};
    index[passport][dest] = req;
    rows++;
  }

  const passports = Object.keys(index).length;
  const ts = `// Auto-generated from https://github.com/imorte/passport-index-data (MIT license)
// DO NOT EDIT MANUALLY — run scripts/generate-visa-data.js to regenerate
// Last generated: ${new Date().toISOString().split("T")[0]}
// Coverage: ${passports} passports × ${rows / passports | 0} destinations (~${rows} pairs)

export const VISA_INDEX: Record<string, Record<string, string>> = ${JSON.stringify(index, null, 2)};
`;

  fs.writeFileSync(OUT_PATH, ts, "utf8");
  console.log(`Written ${passports} passports (${rows} pairs) to src/data/visa-index.ts`);
}

main().catch((e) => { console.error(e); process.exit(1); });
