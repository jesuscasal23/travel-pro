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
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
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
  accessKey: string,
  resultIndex = 0
): Promise<UnsplashPhoto | null> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  // Fetch 2 results when we want the second one, otherwise 1 is enough
  url.searchParams.set("per_page", resultIndex > 0 ? "2" : "1");

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
  return data.results[resultIndex] ?? null;
}

async function downloadImage(rawUrl: string, destPath: string): Promise<void> {
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

const BATCH_SIZE = 24; // 2 requests per city → stay under 50 req/hour limit
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
  // Track which cities still need their second image
  const slugsNeedingImage2 = new Set(
    manifest.entries.filter((e) => !e.unsplashId2).map((e) => e.slug)
  );
  console.log(`Manifest has ${manifest.entries.length} existing entries.`);
  console.log(`  ${slugsNeedingImage2.size} entries still need a second image.`);

  // Cities needing first image
  const pendingFirst = CITIES.filter((c) => !existingSlugs.has(slugify(c.city)));
  // Cities needing second image (already have first)
  const pendingSecond = CITIES.filter(
    (c) => existingSlugs.has(slugify(c.city)) && slugsNeedingImage2.has(slugify(c.city))
  );

  const totalPending = pendingFirst.length + pendingSecond.length;
  if (totalPending === 0) {
    console.log("All cities already have two images. Nothing to do.");
    return;
  }

  console.log(
    `${pendingFirst.length} cities need first image, ` +
      `${pendingSecond.length} cities need second image. Starting download...\n`
  );

  let batchCount = 0;
  let downloadedInBatch = 0;
  let totalDownloaded = 0;
  let failedCities: string[] = [];

  // ── Helper: check + wait for batch limit ──────────────────────
  async function checkBatchLimit(label: string, lastItem: boolean): Promise<void> {
    if (downloadedInBatch >= BATCH_SIZE && !lastItem) {
      console.log(`\n  Batch ${batchCount + 1} complete (${downloadedInBatch} requests). ${label}`);
      await writeManifest(manifest);
      console.log(`  Manifest saved (${manifest.entries.length} entries).`);
      downloadedInBatch = 0;
      batchCount++;
      await waitForNextBatch(batchCount);
    }
  }

  // ── Phase 1: cities that need their first image ────────────────
  for (let i = 0; i < pendingFirst.length; i++) {
    const city = pendingFirst[i];
    const slug = slugify(city.city);
    const cc = city.countryCode.toLowerCase();
    const progress = `[${manifest.entries.length + 1}/${CITIES.length}]`;

    try {
      // --- Primary search (result index 0 = first photo) ---
      let photo = await searchUnsplash(`${city.city} ${city.country} travel`, accessKey, 0);
      downloadedInBatch++;

      // Country fallback if no results
      if (!photo) {
        console.log(`  ${progress} No results for "${city.city}", trying country fallback...`);
        photo = await searchUnsplash(`${city.country} landscape travel`, accessKey, 0);
        downloadedInBatch++;
      }

      if (!photo) {
        console.log(`  ${progress} SKIP: No image found for ${city.city}, ${city.country}`);
        failedCities.push(`${city.city}, ${city.country} (image 1)`);
        await delay(REQUEST_DELAY_MS);
        await checkBatchLimit("(after skip)", i === pendingFirst.length - 1);
        continue;
      }

      // Download first image
      await downloadImage(photo.urls.raw, getImagePath(cc, slug, 1));

      // Add to manifest (without image 2 yet — filled in phase 2)
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
      slugsNeedingImage2.add(slug); // Queue for phase 2
      totalDownloaded++;

      console.log(`  ${progress} [1/2] Downloaded ${cc}/${slug}.webp (by ${photo.user.name})`);

      // --- Second image immediately after the first ---
      await delay(REQUEST_DELAY_MS);
      await checkBatchLimit("(between image 1 and 2)", false);

      const photo2 = await searchUnsplash(`${city.city} ${city.country} travel`, accessKey, 1);
      downloadedInBatch++;

      if (photo2 && photo2.id !== photo.id) {
        await downloadImage(photo2.urls.raw, getImagePath(cc, slug, 2));
        entry.unsplashId2 = photo2.id;
        entry.photographer2 = photo2.user.name;
        entry.photographerUrl2 = photo2.user.links.html;
        slugsNeedingImage2.delete(slug);
        totalDownloaded++;
        console.log(`  ${progress} [2/2] Downloaded ${cc}/${slug}-2.webp (by ${photo2.user.name})`);
      } else {
        console.log(
          `  ${progress} [2/2] No distinct second image for ${city.city} — will retry in pass 2`
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message === "RATE_LIMIT_HIT") {
        console.log("\n  Rate limit hit! Saving manifest and waiting...");
        await writeManifest(manifest);
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
    await checkBatchLimit("", i === pendingFirst.length - 1);
  }

  // ── Phase 2: cities that already have image 1 but not image 2 ──
  if (pendingSecond.length > 0) {
    console.log(
      `\n--- Phase 2: fetching second images for ${pendingSecond.length} existing cities ---\n`
    );
  }

  for (let i = 0; i < pendingSecond.length; i++) {
    const city = pendingSecond[i];
    const slug = slugify(city.city);
    const cc = city.countryCode.toLowerCase();
    const entry = manifest.entries.find((e) => e.slug === slug);
    if (!entry) continue;

    const progress = `[2nd img ${i + 1}/${pendingSecond.length}]`;

    try {
      const photo2 = await searchUnsplash(`${city.city} ${city.country} travel`, accessKey, 1);
      downloadedInBatch++;

      if (photo2 && photo2.id !== entry.unsplashId) {
        await downloadImage(photo2.urls.raw, getImagePath(cc, slug, 2));
        entry.unsplashId2 = photo2.id;
        entry.photographer2 = photo2.user.name;
        entry.photographerUrl2 = photo2.user.links.html;
        slugsNeedingImage2.delete(slug);
        totalDownloaded++;
        console.log(`  ${progress} Downloaded ${cc}/${slug}-2.webp (by ${photo2.user.name})`);
      } else {
        // Try a slightly different query as fallback
        const photo2b = await searchUnsplash(`${city.city} cityscape`, accessKey, 0);
        downloadedInBatch++;
        if (photo2b && photo2b.id !== entry.unsplashId) {
          await downloadImage(photo2b.urls.raw, getImagePath(cc, slug, 2));
          entry.unsplashId2 = photo2b.id;
          entry.photographer2 = photo2b.user.name;
          entry.photographerUrl2 = photo2b.user.links.html;
          slugsNeedingImage2.delete(slug);
          totalDownloaded++;
          console.log(
            `  ${progress} Downloaded ${cc}/${slug}-2.webp via fallback (by ${photo2b.user.name})`
          );
        } else {
          console.log(`  ${progress} SKIP: Could not find distinct second image for ${city.city}`);
          failedCities.push(`${city.city}, ${city.country} (image 2)`);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message === "RATE_LIMIT_HIT") {
        console.log("\n  Rate limit hit! Saving manifest and waiting...");
        await writeManifest(manifest);
        i--;
        downloadedInBatch = 0;
        await waitForNextBatch(batchCount);
        batchCount++;
        continue;
      }
      console.error(`  ${progress} ERROR for ${city.city}: ${err}`);
      failedCities.push(`${city.city}, ${city.country} (image 2)`);
    }

    await delay(REQUEST_DELAY_MS);
    await checkBatchLimit("", i === pendingSecond.length - 1);
  }

  // Final save
  await writeManifest(manifest);

  console.log("\n==============================");
  console.log(`Done! Downloaded ${totalDownloaded} images.`);
  console.log(`Manifest: ${manifest.entries.length}/${CITIES.length} cities.`);
  const stillMissingSecond = manifest.entries.filter((e) => !e.unsplashId2).length;
  if (stillMissingSecond > 0) {
    console.log(`  ${stillMissingSecond} cities still missing second image (re-run to retry).`);
  }
  if (failedCities.length > 0) {
    console.log(`\nFailed (${failedCities.length}):`);
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
