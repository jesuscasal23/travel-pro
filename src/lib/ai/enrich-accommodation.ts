// ============================================================
// Accommodation Enrichment — SerpApi Hotels + AI Ranking
// ============================================================

import type { CityStop, CityAccommodation, CityHotel, TravelStyle } from "@/types";
import { searchHotels } from "@/lib/hotels";
import type { HotelCandidate } from "@/lib/hotels";
import { buildHotelLink, buildTrackedLink } from "@/lib/features/affiliate/link-generator";
import { getAnthropic } from "@/lib/ai/client";
import { getOptionalSerpApiEnv } from "@/lib/config/server-env";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("enrichment:accommodation");

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
  candidates: HotelCandidate[],
  city: string,
  travelStyle: TravelStyle
): Promise<Array<{ hotelId: string; why: string }>> {
  if (candidates.length === 0) return [];

  const hotelList = candidates
    .slice(0, 10)
    .map((h, i) => {
      const stars = h.rating ? `${h.rating}★` : "?★";
      const review = h.overallRating
        ? ` (${h.overallRating}/5, ${h.reviewCount ?? "?"} reviews)`
        : "";
      const price = h.pricePerNight ? `${h.pricePerNight} ${h.currency}/night` : "price N/A";
      const amenities = h.amenities?.slice(0, 5).join(", ") ?? "";
      return `${i + 1}. [${h.hotelId}] ${h.name} — ${stars}${review}, ${price}${amenities ? `, amenities: ${amenities}` : ""}`;
    })
    .join("\n");

  const prompt = `You are a travel assistant. A "${travelStyle}" traveler is visiting ${city}.
Rank the top 3 hotels from this list and explain why each is a good fit in 1 short sentence.

Hotels:
${hotelList}

Reply ONLY with a JSON array: [{"hotelId":"...","why":"..."}]
Use the hotelId from the brackets. Pick exactly 3 (or fewer if less available).`;

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
    log.warn("AI ranking failed, using price order", { city, error: String(e) });
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

function buildHotelBookingUrl(
  city: CityStop,
  checkIn: string,
  checkOut: string,
  travelers: number
): string {
  return buildTrackedLink({
    provider: "booking",
    type: "hotel",
    city: city.city,
    dest: buildHotelLink({ ...city, arrivalDate: checkIn, departureDate: checkOut }, travelers),
  });
}

function emptyCityResult(
  city: CityStop,
  checkIn: string,
  checkOut: string,
  fallbackSearchUrl: string
): CityAccommodation {
  return {
    city: city.city,
    countryCode: city.countryCode,
    checkIn,
    checkOut,
    hotels: [],
    fallbackSearchUrl,
  };
}

/**
 * Enrich accommodation for all cities in the route.
 * For each city: search hotels via SerpApi -> AI rank top 3.
 * Gracefully returns fallback URLs when SerpApi is unavailable.
 */
export async function enrichAccommodation(
  route: CityStop[],
  dateStart: string,
  travelers: number,
  travelStyle: TravelStyle
): Promise<CityAccommodation[]> {
  const serpEnv = getOptionalSerpApiEnv();
  if (!serpEnv) {
    log.warn("SerpApi credentials missing — returning fallback URLs for all cities");
    const cityDates = computeCityDates(route, dateStart);
    return cityDates.map(({ city, checkIn, checkOut }) =>
      emptyCityResult(city, checkIn, checkOut, buildFallbackUrl(city, checkIn, checkOut, travelers))
    );
  }

  const cityDates = computeCityDates(route, dateStart);

  const results = await Promise.all(
    cityDates.map(async ({ city, checkIn, checkOut }) => {
      const fallbackSearchUrl = buildFallbackUrl(city, checkIn, checkOut, travelers);

      try {
        const candidates = await searchHotels(
          serpEnv.apiKey,
          city.city,
          checkIn,
          checkOut,
          travelers,
          { minStars: 3 }
        );

        if (candidates.length === 0) {
          log.warn("No hotels returned from SerpApi for city", {
            city: city.city,
            checkIn,
            checkOut,
          });
          return emptyCityResult(city, checkIn, checkOut, fallbackSearchUrl);
        }

        const withLink = candidates.filter((c) => !!c.link).length;
        log.info("Hotel candidates fetched", {
          city: city.city,
          count: candidates.length,
          withDirectLink: withLink,
          withoutDirectLink: candidates.length - withLink,
        });

        // AI rank the candidates
        const ranked = await rankHotelsWithAI(candidates, city.city, travelStyle);
        const rankedMap = new Map(ranked.map((r) => [r.hotelId, r.why]));
        const bookingUrl = buildHotelBookingUrl(city, checkIn, checkOut, travelers);

        // Build final hotel list — ranked hotels first, then fill to 3
        const hotels: CityHotel[] = [];
        for (const r of ranked) {
          const c = candidates.find((h) => h.hotelId === r.hotelId);
          if (!c) continue;
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
            bookingUrl: c.link ?? bookingUrl,
            why: rankedMap.get(c.hotelId) ?? "Well-rated hotel.",
          });
        }

        // Fill remaining slots if AI returned fewer than 3
        for (const c of candidates) {
          if (hotels.length >= 3) break;
          if (hotels.some((h) => h.hotelId === c.hotelId)) continue;
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
            bookingUrl: c.link ?? bookingUrl,
            why: "Well-rated hotel in a convenient location.",
          });
        }

        // Log final hotel booking URL sources
        for (const h of hotels) {
          const candidate = candidates.find((c) => c.hotelId === h.hotelId);
          const usedSerpApiLink = !!candidate?.link;
          log.info("Hotel booking URL assigned", {
            city: city.city,
            hotel: h.name,
            hotelId: h.hotelId,
            usedSerpApiLink,
            bookingUrl: h.bookingUrl.slice(0, 150),
            serpApiLink: candidate?.link?.slice(0, 150) ?? null,
          });
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
        log.warn("Accommodation enrichment failed for city", {
          city: city.city,
          error: String(e),
        });
        return emptyCityResult(city, checkIn, checkOut, fallbackSearchUrl);
      }
    })
  );

  return results;
}
