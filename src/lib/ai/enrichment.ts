// ============================================================
// Travel Pro — Enrichment Layer
//
// enrichVisa  — hardcoded for Phase 0 (German passport, JP/VN/TH)
// enrichWeather — Open-Meteo archive API + Upstash Redis cache (7-day TTL)
// ============================================================

import { Redis } from "@upstash/redis";
import type {
  CityStop,
  VisaInfo,
  CityWeather,
  CityAccommodation,
  CityHotel,
  TravelStyle,
} from "@/types";
import { VISA_INDEX } from "@/data/visa-index";
import { VISA_OFFICIAL_URLS } from "@/data/visa-official-urls";
import { NATIONALITY_TO_ISO2 } from "@/data/nationality-to-iso2";
import { searchHotelsByCity, searchHotelOffers, buildCandidates } from "@/lib/hotels";
import { buildHotelLink } from "@/lib/affiliate/link-generator";
import { buildTrackedLink } from "@/lib/affiliate/link-generator";
import { getAnthropic } from "@/lib/ai/client";
import { createLogger } from "@/lib/core/logger";

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
    return {
      requirement: "visa-free",
      maxStayDays: 365,
      label: "Own country",
      icon: "🏠",
      notes: "This is your home country.",
    };
  }
  if (raw === "no admission") {
    return {
      requirement: "no-admission",
      maxStayDays: 0,
      label: "No admission",
      icon: "🚫",
      notes: "Entry not permitted with this passport.",
    };
  }
  if (raw === "visa required") {
    return {
      requirement: "visa-required",
      maxStayDays: 0,
      label: "Visa required",
      icon: "🛂",
      notes: "A visa must be obtained from the embassy before travel.",
    };
  }
  if (raw === "visa on arrival") {
    return {
      requirement: "visa-on-arrival",
      maxStayDays: 30,
      label: "Visa on arrival",
      icon: "🛬",
      notes: "Visa available on arrival. Carry proof of onward travel and sufficient funds.",
    };
  }
  if (raw === "e-visa") {
    return {
      requirement: "e-visa",
      maxStayDays: 30,
      label: "E-visa required",
      icon: "💻",
      notes: "Apply online before travel. Processing times vary — apply at least 5–7 days ahead.",
    };
  }
  if (raw === "eta") {
    return {
      requirement: "eta",
      maxStayDays: 90,
      label: "ETA required",
      icon: "📱",
      notes:
        "Electronic Travel Authorisation required. Apply online — usually approved within minutes.",
    };
  }
  if (raw === "visa free") {
    return {
      requirement: "visa-free",
      maxStayDays: 0,
      label: "Visa-free",
      icon: "✅",
      notes: "No visa required. Check destination country for exact entry conditions.",
    };
  }
  // Numeric string = visa-free days
  const days = parseInt(raw, 10);
  if (!isNaN(days)) {
    return {
      requirement: "visa-free",
      maxStayDays: days,
      label: `Visa-free (${days} days)`,
      icon: "✅",
      notes: `No visa required for stays up to ${days} days.`,
    };
  }
  // Unknown fallback
  return {
    requirement: "visa-required",
    maxStayDays: 0,
    label: "Check embassy",
    icon: "🛂",
    notes: "Requirements unknown — check the official embassy website.",
  };
}

/**
 * Enrich visa data for each unique country in the route.
 * Uses the Passport Index static dataset (199 passports × 227 destinations).
 */
export async function enrichVisa(passportCountry: string, route: CityStop[]): Promise<VisaInfo[]> {
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
async function getHistoricalWeather(
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

  // 5s timeout — prevents a hanging Open-Meteo request from stalling the pipeline
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
    });
  } catch {
    // Timeout (AbortError) or network error — return neutral fallback
    return { avgTemp: 25, condition: "Warm", icon: "☀️" };
  } finally {
    clearTimeout(timeoutId);
  }

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
export async function enrichWeather(route: CityStop[], dateStart: string): Promise<CityWeather[]> {
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

// ============================================================
// Accommodation Enrichment — Amadeus Hotels + AI Ranking
// ============================================================

const accomLog = createLogger("enrichment:accommodation");

/**
 * Compute check-in and check-out dates for each city in the route.
 */
function computeCityDates(
  route: CityStop[],
  dateStart: string
): Array<{ city: CityStop; checkIn: string; checkOut: string; nights: number }> {
  const start = new Date(dateStart);
  const cursor = new Date(start);

  return route.map((stop) => {
    const checkIn = cursor.toISOString().slice(0, 10);
    cursor.setDate(cursor.getDate() + stop.days);
    const checkOut = cursor.toISOString().slice(0, 10);
    return { city: stop, checkIn, checkOut, nights: stop.days };
  });
}

/**
 * Use Claude Haiku to rank hotel candidates for a travel style.
 * Returns top 3 with a short "why" reason.
 */
async function rankHotelsWithAI(
  candidates: Array<{
    hotelId: string;
    name: string;
    rating?: number;
    pricePerNight?: number;
    currency: string;
  }>,
  city: string,
  travelStyle: TravelStyle
): Promise<Array<{ hotelId: string; why: string }>> {
  if (candidates.length === 0) return [];

  const hotelList = candidates
    .slice(0, 10)
    .map(
      (h, i) =>
        `${i + 1}. ${h.name} (${h.rating ?? "?"}★, ${h.pricePerNight ?? "?"} ${h.currency}/night)`
    )
    .join("\n");

  const prompt = `You are a travel assistant. A "${travelStyle}" traveler is visiting ${city}.
Rank the top 3 hotels from this list and explain why each is a good fit in 1 short sentence.

Hotels:
${hotelList}

Reply ONLY with a JSON array: [{"hotelId":"...","why":"..."}]
Use the hotelId from the list. Pick exactly 3 (or fewer if less available).`;

  try {
    const message = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") return [];

    const text = block.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]) as Array<{ hotelId: string; why: string }>;
  } catch (e) {
    accomLog.warn("AI ranking failed, using price order", { city, error: String(e) });
    return candidates.slice(0, 3).map((h) => ({
      hotelId: h.hotelId,
      why: "Well-rated hotel in a convenient location.",
    }));
  }
}

/**
 * Build a fallback Booking.com search URL for a city.
 */
function buildFallbackUrl(
  city: CityStop,
  checkIn: string,
  checkOut: string,
  travelers: number
): string {
  const rawUrl = buildHotelLink(
    { ...city, id: city.id, days: city.days, arrivalDate: checkIn, departureDate: checkOut },
    travelers
  );
  return buildTrackedLink({
    provider: "booking",
    type: "hotel",
    city: city.city,
    dest: rawUrl,
  });
}

/**
 * Enrich accommodation for all cities in the route.
 * For each city: search hotels → get offers → AI rank top 3.
 * Gracefully returns fallback URLs when Amadeus is unavailable.
 */
export async function enrichAccommodation(
  route: CityStop[],
  dateStart: string,
  travelers: number,
  travelStyle: TravelStyle
): Promise<CityAccommodation[]> {
  const cityDates = computeCityDates(route, dateStart);

  const results = await Promise.all(
    cityDates.map(async ({ city, checkIn, checkOut, nights }) => {
      const fallbackSearchUrl = buildFallbackUrl(city, checkIn, checkOut, travelers);
      const iataCode = city.iataCode;

      if (!iataCode) {
        accomLog.info("No IATA code for city, using fallback", { city: city.city });
        return {
          city: city.city,
          countryCode: city.countryCode,
          checkIn,
          checkOut,
          hotels: [],
          fallbackSearchUrl,
        } satisfies CityAccommodation;
      }

      try {
        const hotelList = await searchHotelsByCity(iataCode);
        if (!hotelList || hotelList.length === 0) {
          accomLog.warn("No hotels returned from Amadeus for city", {
            city: city.city,
            iataCode,
            hotelListNull: hotelList === null,
          });
          return {
            city: city.city,
            countryCode: city.countryCode,
            checkIn,
            checkOut,
            hotels: [],
            fallbackSearchUrl,
          } satisfies CityAccommodation;
        }

        accomLog.info("Hotel list fetched", { city: city.city, iataCode, count: hotelList.length });
        const hotelIds = hotelList.map((h) => h.hotelId);
        const offers = await searchHotelOffers(hotelIds, checkIn, checkOut, travelers);
        accomLog.info("Hotel offers fetched", {
          city: city.city,
          offersNull: offers === null,
          offersCount: offers?.length ?? 0,
        });
        const candidates = buildCandidates(hotelList, offers, nights);

        if (candidates.length === 0) {
          accomLog.warn("No candidates with prices after merging offers", {
            city: city.city,
            hotelCount: hotelList.length,
            offersCount: offers?.length ?? 0,
          });
          return {
            city: city.city,
            countryCode: city.countryCode,
            checkIn,
            checkOut,
            hotels: [],
            fallbackSearchUrl,
          } satisfies CityAccommodation;
        }

        // AI rank the candidates
        const ranked = await rankHotelsWithAI(candidates, city.city, travelStyle);
        const rankedMap = new Map(ranked.map((r) => [r.hotelId, r.why]));

        // Build final hotel list — ranked hotels first, then fill to 3
        const hotels: CityHotel[] = [];
        for (const r of ranked) {
          const c = candidates.find((h) => h.hotelId === r.hotelId);
          if (!c) continue;

          const bookingUrl = buildTrackedLink({
            provider: "booking",
            type: "hotel",
            city: city.city,
            dest: buildHotelLink(
              { ...city, arrivalDate: checkIn, departureDate: checkOut },
              travelers
            ),
          });

          hotels.push({
            hotelId: c.hotelId,
            name: c.name,
            city: city.city,
            rating: c.rating,
            pricePerNight: c.pricePerNight,
            totalPrice: c.totalPrice,
            currency: c.currency,
            address: c.address,
            distance: c.distance,
            bookingUrl,
            why: rankedMap.get(c.hotelId) ?? "Well-rated hotel.",
          });
        }

        // Fill remaining slots if AI returned fewer than 3
        if (hotels.length < 3) {
          for (const c of candidates) {
            if (hotels.length >= 3) break;
            if (hotels.some((h) => h.hotelId === c.hotelId)) continue;

            const bookingUrl = buildTrackedLink({
              provider: "booking",
              type: "hotel",
              city: city.city,
              dest: buildHotelLink(
                { ...city, arrivalDate: checkIn, departureDate: checkOut },
                travelers
              ),
            });

            hotels.push({
              hotelId: c.hotelId,
              name: c.name,
              city: city.city,
              rating: c.rating,
              pricePerNight: c.pricePerNight,
              totalPrice: c.totalPrice,
              currency: c.currency,
              address: c.address,
              distance: c.distance,
              bookingUrl,
              why: "Well-rated hotel in a convenient location.",
            });
          }
        }

        return {
          city: city.city,
          countryCode: city.countryCode,
          checkIn,
          checkOut,
          hotels,
          fallbackSearchUrl,
        } satisfies CityAccommodation;
      } catch (e) {
        accomLog.warn("Accommodation enrichment failed for city", {
          city: city.city,
          error: String(e),
        });
        return {
          city: city.city,
          countryCode: city.countryCode,
          checkIn,
          checkOut,
          hotels: [],
          fallbackSearchUrl,
        } satisfies CityAccommodation;
      }
    })
  );

  return results;
}
