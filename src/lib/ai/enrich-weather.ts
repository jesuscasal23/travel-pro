// ============================================================
// Weather Enrichment — Open-Meteo archive API
// ============================================================

import type { CityStop, CityWeather } from "@/types";
import { WEATHER_API_TIMEOUT_MS } from "@/lib/config/constants";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("enrichment:weather");

function avg(arr: number[]): number {
  if (!arr || arr.length === 0) return 0;
  const valid = arr.filter((v) => v != null && !isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function deriveCondition(avgTemp: number, avgPrecip: number): { condition: string; icon: string } {
  if (avgPrecip > 8) return { condition: "Rainy", icon: "\u{1F327}\uFE0F" };
  if (avgPrecip > 4) return { condition: "Occasionally rainy", icon: "\u{1F326}\uFE0F" };
  if (avgTemp > 32) return { condition: "Hot & humid", icon: "\u{1F321}\uFE0F" };
  if (avgTemp > 28) return { condition: "Tropical", icon: "\u{1F334}" };
  if (avgTemp > 24) return { condition: "Warm", icon: "\u2600\uFE0F" };
  if (avgTemp > 19) return { condition: "Partly cloudy", icon: "\u26C5" };
  if (avgTemp > 14) return { condition: "Mild", icon: "\u{1F324}\uFE0F" };
  if (avgTemp > 9) return { condition: "Cool", icon: "\u{1F9E5}" };
  return { condition: "Cold", icon: "\u2744\uFE0F" };
}

interface WeatherAPIResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum?: number[];
  };
}

interface WeatherSummary {
  avgTemp: number;
  condition: string;
  icon: string;
}

/**
 * Fetch historical weather for a city (lat/lng) for a given month.
 * Uses last year's data from the Open-Meteo archive API.
 */
async function getHistoricalWeather(
  lat: number,
  lng: number,
  month: number
): Promise<WeatherSummary> {
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

  // 5s timeout — prevents a hanging Open-Meteo request from stalling the pipeline
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEATHER_API_TIMEOUT_MS);

  const tFetch = Date.now();
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
    });
  } catch (e) {
    log.warn("Weather API fetch failed (timeout or network)", {
      lat,
      lng,
      month,
      duration: `${Date.now() - tFetch}ms`,
      error: e instanceof Error ? e.message : String(e),
    });
    // Timeout (AbortError) or network error — return neutral fallback
    return { avgTemp: 25, condition: "Warm", icon: "\u2600\uFE0F" };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    log.warn("Weather API returned non-OK status", {
      lat,
      lng,
      month,
      status: response.status,
      statusText: response.statusText,
      duration: `${Date.now() - tFetch}ms`,
    });
    // Return a neutral fallback rather than crashing
    return { avgTemp: 25, condition: "Warm", icon: "\u2600\uFE0F" };
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
  return { avgTemp, condition, icon };
}

/**
 * Enrich weather for all cities in the route.
 * Runs in parallel for speed.
 */
export async function enrichWeather(route: CityStop[], dateStart: string): Promise<CityWeather[]> {
  const t0 = Date.now();

  // Parse month from dateStart (ISO format: YYYY-MM-DD)
  let month = 10; // Default to October (demo scenario)
  if (dateStart) {
    const parsed = new Date(dateStart);
    if (!isNaN(parsed.getTime())) {
      month = parsed.getMonth() + 1;
    }
  }

  log.info("enrichWeather: starting", {
    routeCities: route.length,
    cities: route.map((s) => s.city),
    dateStart,
    month,
  });

  const results = await Promise.all(
    route.map(async (stop) => {
      try {
        const weather = await getHistoricalWeather(stop.lat, stop.lng, month);
        return {
          city: stop.city,
          temp: `${weather.avgTemp}\u00B0C`,
          condition: weather.condition,
          icon: weather.icon,
        } satisfies CityWeather;
      } catch (e) {
        log.warn("enrichWeather: per-city fetch failed, using fallback", {
          city: stop.city,
          lat: stop.lat,
          lng: stop.lng,
          error: e instanceof Error ? e.message : String(e),
        });
        // Per-city fallback
        return {
          city: stop.city,
          temp: "25\u00B0C",
          condition: "Warm",
          icon: "\u2600\uFE0F",
        } satisfies CityWeather;
      }
    })
  );

  log.info("enrichWeather: complete", {
    duration: `${Date.now() - t0}ms`,
    resultCount: results.length,
    results: results.map((r) => ({ city: r.city, temp: r.temp, condition: r.condition })),
  });

  return results;
}
