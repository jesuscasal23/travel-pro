/**
 * City image URL helper.
 *
 * Priority:
 * 1. Local manifest (downloaded via `npm run download:images`)
 * 2. Curated Unsplash URLs (hardcoded fallback for 32 popular cities)
 * 3. Generic placeholder gradient
 */

/** Tiny teal-tinted SVG for use as next/image blurDataURL */
export const CITY_IMAGE_BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSI2Ij48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iNiIgZmlsbD0iIzBENzM3NyIgb3BhY2l0eT0iMC4zIi8+PC9zdmc+";

// ── Manifest-based lookup (populated by download:images script) ──

interface ManifestEntry {
  slug: string;
  city: string;
  country: string;
  countryCode: string;
}

let manifestMap: Map<string, string> | null = null;

function getManifestMap(): Map<string, string> {
  if (manifestMap) return manifestMap;
  manifestMap = new Map();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require("../../../../public/images/cities/manifest.json") as {
      entries: ManifestEntry[];
    };
    for (const entry of manifest.entries) {
      manifestMap.set(
        entry.city.toLowerCase(),
        `/images/cities/${entry.countryCode}/${entry.slug}.webp`
      );
    }
  } catch {
    // Manifest doesn't exist yet — fall through to curated/placeholder
  }
  return manifestMap;
}

// ── Curated fallback (hardcoded Unsplash URLs for popular cities) ──

const CURATED_IMAGES: Record<string, string> = {
  "Tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop&q=80",
  "Kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop&q=80",
  "Osaka": "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&h=600&fit=crop&q=80",
  "Hanoi": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=600&fit=crop&q=80",
  "Ha Long Bay": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop&q=80",
  "Ho Chi Minh City": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=600&fit=crop&q=80",
  "Bangkok": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop&q=80",
  "Chiang Mai": "https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=800&h=600&fit=crop&q=80",
  "Phuket": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&h=600&fit=crop&q=80",
  "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop&q=80",
  "London": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop&q=80",
  "New York": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop&q=80",
  "Rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop&q=80",
  "Barcelona": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop&q=80",
  "Istanbul": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=600&fit=crop&q=80",
  "Dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop&q=80",
  "Singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop&q=80",
  "Bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop&q=80",
  "Sydney": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop&q=80",
  "Seoul": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&h=600&fit=crop&q=80",
  "Berlin": "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=600&fit=crop&q=80",
  "Amsterdam": "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop&q=80",
  "Lisbon": "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=600&fit=crop&q=80",
  "Prague": "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&h=600&fit=crop&q=80",
  "Vienna": "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&h=600&fit=crop&q=80",
  "Cairo": "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&h=600&fit=crop&q=80",
  "Marrakech": "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&h=600&fit=crop&q=80",
  "Cape Town": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=600&fit=crop&q=80",
  "Buenos Aires": "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&h=600&fit=crop&q=80",
  "Rio de Janeiro": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=600&fit=crop&q=80",
  "Mexico City": "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&h=600&fit=crop&q=80",
};

// ── Public API ──

export function getCityImage(cityName: string): string {
  // 1. Check local manifest
  const local = getManifestMap().get(cityName.toLowerCase());
  if (local) return local;

  // 2. Check curated Unsplash URLs
  if (CURATED_IMAGES[cityName]) return CURATED_IMAGES[cityName];

  // 3. Return teal placeholder SVG (no external request)
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">` +
      `<rect width="800" height="600" fill="#0D7377" opacity="0.15"/>` +
      `<text x="400" y="310" font-family="system-ui" font-size="24" fill="#0D7377" text-anchor="middle">${cityName}</text>` +
      `</svg>`
  )}`;
}

/** Get a hero-sized image (same source, CSS handles cropping) */
export function getCityHeroImage(cityName: string): string {
  return getCityImage(cityName);
}
