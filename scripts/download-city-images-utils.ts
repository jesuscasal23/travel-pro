import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface ManifestEntry {
  slug: string;
  city: string;
  country: string;
  countryCode: string;
  unsplashId: string;
  photographer: string;
  photographerUrl: string;
}

export interface Manifest {
  generatedAt: string;
  count: number;
  entries: ManifestEntry[];
}

const MANIFEST_PATH = join(
  process.cwd(),
  "public",
  "images",
  "cities",
  "manifest.json"
);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function ensureDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readManifest(): Promise<Manifest> {
  try {
    const raw = await readFile(MANIFEST_PATH, "utf-8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return { generatedAt: new Date().toISOString(), count: 0, entries: [] };
  }
}

export async function writeManifest(manifest: Manifest): Promise<void> {
  manifest.generatedAt = new Date().toISOString();
  manifest.count = manifest.entries.length;
  await ensureDir(MANIFEST_PATH);
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
}

export function getImagePath(countryCode: string, slug: string): string {
  return join(
    process.cwd(),
    "public",
    "images",
    "cities",
    countryCode.toLowerCase(),
    `${slug}.webp`
  );
}

export function getImagePublicPath(countryCode: string, slug: string): string {
  return `/images/cities/${countryCode.toLowerCase()}/${slug}.webp`;
}
