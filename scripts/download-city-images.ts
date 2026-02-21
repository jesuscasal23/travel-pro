/**
 * Download city images from Unsplash API for all cities in the database.
 *
 * Usage:
 *   npx tsx scripts/download-city-images.ts
 *
 * Prerequisites:
 *   - UNSPLASH_ACCESS_KEY in .env.local
 *   - Create a free account at https://unsplash.com/developers
 *
 * The script is resumable — it reads the existing manifest and skips
 * cities that already have images downloaded. Safe to interrupt and restart.
 *
 * Rate limiting: Unsplash free tier allows 50 requests/hour.
 * The script processes 49 cities per batch, then waits 62 minutes.
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  slugify,
  ensureDir,
  delay,
  readManifest,
  writeManifest,
  getImagePath,
  type ManifestEntry,
  type Manifest,
} from "./download-city-images-utils";

// ── Load env vars from .env.local ──────────────────────────────
async function loadEnv(): Promise<void> {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = await readFile(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local might not exist, that's fine — env var could be set directly
  }
}

// ── Unsplash API ───────────────────────────────────────────────

interface UnsplashPhoto {
  id: string;
  urls: { raw: string };
  user: { name: string; links: { html: string } };
}

interface UnsplashSearchResponse {
  total: number;
  results: UnsplashPhoto[];
}

async function searchUnsplash(
  query: string,
  accessKey: string
): Promise<UnsplashPhoto | null> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "1");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  if (!res.ok) {
    const remaining = res.headers.get("X-Ratelimit-Remaining");
    if (res.status === 403 && remaining === "0") {
      throw new Error("RATE_LIMIT_HIT");
    }
    console.error(`  Unsplash API error: ${res.status} ${res.statusText}`);
    return null;
  }

  const data = (await res.json()) as UnsplashSearchResponse;
  return data.results[0] ?? null;
}

async function downloadImage(
  rawUrl: string,
  destPath: string
): Promise<void> {
  // Use Unsplash dynamic URL params for WebP conversion and resizing
  const imageUrl = `${rawUrl}&w=800&h=600&fit=crop&q=80&fm=webp`;
  const res = await fetch(imageUrl);

  if (!res.ok) {
    throw new Error(`Failed to download image: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await ensureDir(destPath);
  await writeFile(destPath, buffer);
}

// ── Main ───────────────────────────────────────────────────────

const BATCH_SIZE = 49; // Stay under 50 req/hour limit
const BATCH_WAIT_MS = 62 * 60 * 1000; // 62 minutes between batches
const REQUEST_DELAY_MS = 200; // Small delay between individual requests

async function main(): Promise<void> {
  await loadEnv();

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.error(
      "Error: UNSPLASH_ACCESS_KEY not set.\n" +
        "Add it to .env.local or set it as an environment variable.\n" +
        "Get your key at https://unsplash.com/developers"
    );
    process.exit(1);
  }

  // Dynamically import cities data
  const { CITIES } = await import("../src/data/cities");
  console.log(`Found ${CITIES.length} cities in database.`);

  // Load existing manifest for resume support
  const manifest = await readManifest();
  const existingSlugs = new Set(manifest.entries.map((e) => e.slug));
  console.log(`Manifest has ${manifest.entries.length} existing entries.`);

  // Filter to cities that still need images
  const pending = CITIES.filter((c) => {
    const slug = slugify(c.city);
    return !existingSlugs.has(slug);
  });

  if (pending.length === 0) {
    console.log("All cities already have images. Nothing to do.");
    return;
  }

  console.log(`${pending.length} cities need images. Starting download...\n`);

  let batchCount = 0;
  let downloadedInBatch = 0;
  let totalDownloaded = 0;
  let failedCities: string[] = [];

  for (let i = 0; i < pending.length; i++) {
    const city = pending[i];
    const slug = slugify(city.city);
    const cc = city.countryCode.toLowerCase();
    const progress = `[${manifest.entries.length + 1}/${CITIES.length}]`;

    try {
      // Search for city image
      let photo = await searchUnsplash(
        `${city.city} ${city.country} travel`,
        accessKey
      );

      // Country fallback if no results
      if (!photo) {
        console.log(`  ${progress} No results for "${city.city}", trying country fallback...`);
        photo = await searchUnsplash(
          `${city.country} landscape travel`,
          accessKey
        );
        downloadedInBatch++; // Count the fallback request too
      }

      if (!photo) {
        console.log(`  ${progress} SKIP: No image found for ${city.city}, ${city.country}`);
        failedCities.push(`${city.city}, ${city.country}`);
        downloadedInBatch++;
        await delay(REQUEST_DELAY_MS);
        continue;
      }

      // Download image
      const destPath = getImagePath(cc, slug);
      await downloadImage(photo.urls.raw, destPath);

      // Add to manifest
      const entry: ManifestEntry = {
        slug,
        city: city.city,
        country: city.country,
        countryCode: cc,
        unsplashId: photo.id,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
      };
      manifest.entries.push(entry);
      existingSlugs.add(slug);

      totalDownloaded++;
      downloadedInBatch++;

      console.log(`  ${progress} Downloaded ${cc}/${slug}.webp (by ${photo.user.name})`);
    } catch (err) {
      if (err instanceof Error && err.message === "RATE_LIMIT_HIT") {
        console.log("\n  Rate limit hit! Saving manifest and waiting...");
        await writeManifest(manifest);
        // Wait and then retry the same city
        i--;
        downloadedInBatch = 0;
        await waitForNextBatch(batchCount);
        batchCount++;
        continue;
      }
      console.error(`  ${progress} ERROR for ${city.city}: ${err}`);
      failedCities.push(`${city.city}, ${city.country}`);
    }

    await delay(REQUEST_DELAY_MS);

    // Check if we've hit the batch limit
    if (downloadedInBatch >= BATCH_SIZE && i < pending.length - 1) {
      console.log(`\n  Batch ${batchCount + 1} complete (${downloadedInBatch} requests).`);
      await writeManifest(manifest);
      console.log(`  Manifest saved (${manifest.entries.length} entries).`);
      downloadedInBatch = 0;
      batchCount++;
      await waitForNextBatch(batchCount);
    }
  }

  // Final save
  await writeManifest(manifest);

  console.log("\n==============================");
  console.log(`Done! Downloaded ${totalDownloaded} images.`);
  console.log(`Manifest: ${manifest.entries.length}/${CITIES.length} cities.`);
  if (failedCities.length > 0) {
    console.log(`\nFailed cities (${failedCities.length}):`);
    failedCities.forEach((c) => console.log(`  - ${c}`));
  }
  console.log("==============================");
}

async function waitForNextBatch(batchNum: number): Promise<void> {
  const waitMinutes = Math.ceil(BATCH_WAIT_MS / 60000);
  const resumeTime = new Date(Date.now() + BATCH_WAIT_MS);
  console.log(
    `\n  Waiting ${waitMinutes} minutes for rate limit reset...` +
      `\n  Will resume at ${resumeTime.toLocaleTimeString()}.` +
      `\n  (Safe to Ctrl+C — progress is saved. Re-run to continue.)\n`
  );
  await delay(BATCH_WAIT_MS);
  console.log("  Rate limit window reset. Continuing...\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
