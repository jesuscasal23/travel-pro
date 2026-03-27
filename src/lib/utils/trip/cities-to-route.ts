import type { CityStop } from "@/types";
import type { CityWithDays } from "@/lib/flights/types";
import { lookupIata } from "@/lib/flights/city-iata-map";

/**
 * Convert CityWithDays[] from route selection into CityStop[],
 * scaling days proportionally to fit within the trip duration.
 */
export function citiesToRoute(cities: CityWithDays[], totalDays: number): CityStop[] {
  const raw = cities.map((c) => ({
    id: c.id,
    city: c.city,
    country: c.country,
    countryCode: c.countryCode,
    lat: c.lat,
    lng: c.lng,
    days: Math.round((c.minDays + c.maxDays) / 2),
    iataCode: c.iataCode || lookupIata(c.city),
  }));

  const total = raw.reduce((s, c) => s + c.days, 0);
  if (totalDays > 0 && total > totalDays) {
    const scale = totalDays / total;
    let remaining = totalDays;
    for (let i = 0; i < raw.length; i++) {
      if (i === raw.length - 1) {
        raw[i].days = Math.max(1, remaining);
      } else {
        raw[i].days = Math.max(1, Math.round(raw[i].days * scale));
        remaining -= raw[i].days;
      }
    }
  }

  return raw;
}
