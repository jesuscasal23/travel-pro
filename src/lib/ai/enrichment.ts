// ============================================================
// Travel Pro — Enrichment Layer
//
// enrichVisa  — hardcoded for Phase 0 (German passport, JP/VN/TH)
// enrichWeather — Open-Meteo archive API + Upstash Redis cache (7-day TTL)
// ============================================================

import { Redis } from "@upstash/redis";
import type { CityStop, VisaInfo, CityWeather } from "@/types";
import { VISA_INDEX } from "@/data/visa-index";
import { VISA_OFFICIAL_URLS } from "@/data/visa-official-urls";
import { NATIONALITY_TO_ISO2 } from "@/data/nationality-to-iso2";

// ============================================================
// Redis client (lazy — only instantiated if env vars are set)
// ============================================================

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// ============================================================
// Visa Enrichment — Passport Index static dataset (199 passports × 227 destinations)
// ============================================================

// Map Passport Index cell value → VisaInfo fields
function parseRequirement(raw: string): {
  requirement: VisaInfo["requirement"];
  maxStayDays: number;
  label: string;
  icon: string;
  notes: string;
} {
  if (raw === "-1") {
    return { requirement: "visa-free", maxStayDays: 365, label: "Own country", icon: "🏠", notes: "This is your home country." };
  }
  if (raw === "no admission") {
    return { requirement: "no-admission", maxStayDays: 0, label: "No admission", icon: "🚫", notes: "Entry not permitted with this passport." };
  }
  if (raw === "visa required") {
    return { requirement: "visa-required", maxStayDays: 0, label: "Visa required", icon: "🛂", notes: "A visa must be obtained from the embassy before travel." };
  }
  if (raw === "visa on arrival") {
    return { requirement: "visa-on-arrival", maxStayDays: 30, label: "Visa on arrival", icon: "🛬", notes: "Visa available on arrival. Carry proof of onward travel and sufficient funds." };
  }
  if (raw === "e-visa") {
    return { requirement: "e-visa", maxStayDays: 30, label: "E-visa required", icon: "💻", notes: "Apply online before travel. Processing times vary — apply at least 5–7 days ahead." };
  }
  if (raw === "eta") {
    return { requirement: "eta", maxStayDays: 90, label: "ETA required", icon: "📱", notes: "Electronic Travel Authorisation required. Apply online — usually approved within minutes." };
  }
  if (raw === "visa free") {
    return { requirement: "visa-free", maxStayDays: 0, label: "Visa-free", icon: "✅", notes: "No visa required. Check destination country for exact entry conditions." };
  }
  // Numeric string = visa-free days
  const days = parseInt(raw, 10);
  if (!isNaN(days)) {
    return { requirement: "visa-free", maxStayDays: days, label: `Visa-free (${days} days)`, icon: "✅", notes: `No visa required for stays up to ${days} days.` };
  }
  // Unknown fallback
  return { requirement: "visa-required", maxStayDays: 0, label: "Check embassy", icon: "🛂", notes: "Requirements unknown — check the official embassy website." };
}

/**
 * Enrich visa data for each unique country in the route.
 * Uses the Passport Index static dataset (199 passports × 227 destinations).
 */
export async function enrichVisa(
  passportCountry: string,
  route: CityStop[]
): Promise<VisaInfo[]> {
  // Resolve nationality string → ISO-2 passport code
  const passportISO2 =
    NATIONALITY_TO_ISO2[passportCountry] ??
    (passportCountry.length === 2 ? passportCountry.toUpperCase() : null);

  // Deduplicate by countryCode
  const seen = new Set<string>();
  const uniqueCountries = route.filter((stop) => {
    if (seen.has(stop.countryCode)) return false;
    seen.add(stop.countryCode);
    return true;
  });

  return uniqueCountries.map((stop) => {
    const destISO2 = stop.countryCode;
    const source = VISA_OFFICIAL_URLS[destISO2] ?? {
      url: "https://www.timatic.iata.org",
      label: "IATA Timatic",
    };

    // Look up in the index
    const raw = passportISO2 ? VISA_INDEX[passportISO2]?.[destISO2] : undefined;

    if (raw) {
      const parsed = parseRequirement(raw);
      return {
        country: stop.country,
        countryCode: destISO2,
        ...parsed,
        sourceUrl: source.url,
        sourceLabel: source.label,
      };
    }

    // Passport not found in index — generic fallback
    return {
      country: stop.country,
      countryCode: destISO2,
      requirement: "visa-required" as const,
      maxStayDays: 0,
      notes: "We don't have data for this passport. Check the official embassy website.",
      icon: "🛂",
      label: "Check embassy",
      sourceUrl: source.url,
      sourceLabel: source.label,
    };
  });
}

// ============================================================
// Weather Enrichment — Open-Meteo archive API + Redis cache
// ============================================================

interface WeatherAPIResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum?: number[];
  };
}

function avg(arr: number[]): number {
  if (!arr || arr.length === 0) return 0;
  const valid = arr.filter((v) => v != null && !isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function deriveCondition(avgTemp: number, avgPrecip: number): { condition: string; icon: string } {
  if (avgPrecip > 8) return { condition: "Rainy", icon: "🌧️" };
  if (avgPrecip > 4) return { condition: "Occasionally rainy", icon: "🌦️" };
  if (avgTemp > 32) return { condition: "Hot & humid", icon: "🌡️" };
  if (avgTemp > 28) return { condition: "Tropical", icon: "🌴" };
  if (avgTemp > 24) return { condition: "Warm", icon: "☀️" };
  if (avgTemp > 19) return { condition: "Partly cloudy", icon: "⛅" };
  if (avgTemp > 14) return { condition: "Mild", icon: "🌤️" };
  if (avgTemp > 9) return { condition: "Cool", icon: "🧥" };
  return { condition: "Cold", icon: "❄️" };
}

interface WeatherSummary {
  avgTemp: number;
  condition: string;
  icon: string;
}

/**
 * Fetch historical weather for a city (lat/lng) for a given month.
 * Uses last year's data. Cached in Redis for 7 days.
 */
export async function getHistoricalWeather(
  lat: number,
  lng: number,
  month: number
): Promise<WeatherSummary> {
  const cacheKey = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}:${month}`;

  // Try Redis cache first
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get<WeatherSummary>(cacheKey);
      if (cached) return cached;
    } catch {
      // Cache miss or connection error — continue to API
    }
  }

  // Use previous year's data for the requested month
  const year = new Date().getFullYear() - 1;
  const mm = String(month).padStart(2, "0");
  const startDate = `${year}-${mm}-01`;
  // Use the 28th to avoid month-length issues
  const endDate = `${year}-${mm}-28`;

  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lng.toFixed(4));
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString(), {
    next: { revalidate: 0 }, // Always fresh from cache layer, not Next.js cache
  });

  if (!response.ok) {
    // Return a neutral fallback rather than crashing
    return { avgTemp: 25, condition: "Warm", icon: "☀️" };
  }

  const data: WeatherAPIResponse = await response.json();

  const maxTemps = data.daily?.temperature_2m_max ?? [];
  const minTemps = data.daily?.temperature_2m_min ?? [];
  const precip = data.daily?.precipitation_sum ?? [];

  const avgMax = avg(maxTemps);
  const avgMin = avg(minTemps);
  const avgTemp = Math.round((avgMax + avgMin) / 2);
  const avgPrecip = avg(precip);

  const { condition, icon } = deriveCondition(avgTemp, avgPrecip);
  const result: WeatherSummary = { avgTemp, condition, icon };

  // Store in Redis cache
  if (redis) {
    try {
      await redis.set(cacheKey, result, { ex: CACHE_TTL_SECONDS });
    } catch {
      // Cache write failure is non-fatal
    }
  }

  return result;
}

/**
 * Enrich weather for all cities in the route.
 * Runs in parallel for speed.
 */
export async function enrichWeather(
  route: CityStop[],
  dateStart: string
): Promise<CityWeather[]> {
  // Parse month from dateStart (ISO format: YYYY-MM-DD)
  let month = 10; // Default to October (demo scenario)
  if (dateStart) {
    const parsed = new Date(dateStart);
    if (!isNaN(parsed.getTime())) {
      month = parsed.getMonth() + 1;
    }
  }

  const results = await Promise.all(
    route.map(async (stop) => {
      try {
        const weather = await getHistoricalWeather(stop.lat, stop.lng, month);
        return {
          city: stop.city,
          temp: `${weather.avgTemp}°C`,
          condition: weather.condition,
          icon: weather.icon,
        } satisfies CityWeather;
      } catch {
        // Per-city fallback
        return {
          city: stop.city,
          temp: "25°C",
          condition: "Warm",
          icon: "☀️",
        } satisfies CityWeather;
      }
    })
  );

  return results;
}
