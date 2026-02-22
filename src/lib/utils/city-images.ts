/**
 * City image URL helper.
 *
 * Constructs a deterministic path from city name + country code:
 *   /images/cities/{cc}/{slug}.webp
 *
 * Images are downloaded via `npm run download:images`.
 * If an image doesn't exist yet, consumers handle the 404 via onError.
 */

/** Tiny teal-tinted SVG for use as next/image blurDataURL */
export const CITY_IMAGE_BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSI2Ij48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iNiIgZmlsbD0iIzBENzM3NyIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a teal placeholder SVG with the city name */
export function getCityPlaceholder(cityName: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">` +
      `<rect width="800" height="600" fill="#0D7377" opacity="0.15"/>` +
      `<text x="400" y="310" font-family="system-ui" font-size="24" fill="#0D7377" text-anchor="middle">${cityName}</text>` +
      `</svg>`
  )}`;
}

/**
 * Get the image URL for a city.
 * Returns a deterministic path to the local WebP file.
 * Consumers should use onError to fall back to getCityPlaceholder().
 */
export function getCityImage(cityName: string, countryCode: string): string {
  const slug = slugify(cityName);
  const cc = countryCode.toLowerCase();
  return `/images/cities/${cc}/${slug}.webp`;
}

/** Get a hero-sized image (same source, CSS handles cropping) */
export function getCityHeroImage(cityName: string, countryCode: string): string {
  return getCityImage(cityName, countryCode);
}
