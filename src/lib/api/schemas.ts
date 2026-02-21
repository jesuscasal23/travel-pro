import { z } from "zod";

/** Zod schema for profile data sent with generation requests. */
export const ProfileInputSchema = z.object({
  nationality: z.string().min(1).max(100),
  homeAirport: z.string().min(2).max(100),
  travelStyle: z.enum(["backpacker", "comfort", "luxury"]),
  interests: z.array(z.string().max(50)).max(10),
});

/** Zod schema for trip intent data shared across generation endpoints. */
export const TripIntentInputSchema = z.object({
  id: z.string().max(100),
  tripType: z.enum(["single-city", "single-country", "multi-city"]).default("multi-city"),
  region: z.string().max(100).default(""),
  destination: z.string().max(100).optional(),
  destinationCountry: z.string().max(100).optional(),
  destinationCountryCode: z.string().max(10).optional(),
  destinationLat: z.number().optional(),
  destinationLng: z.number().optional(),
  dateStart: z.string().max(20),
  dateEnd: z.string().max(20),
  flexibleDates: z.boolean().default(false),
  travelers: z.number().int().min(1).max(20),
}).refine(
  (d) => {
    if (d.tripType === "multi-city") return d.region.length > 0;
    if (d.tripType === "single-country") return !!d.destinationCountry;
    return !!d.destination; // single-city
  },
  { message: "Multi-country trips require region; single-country requires country; single-city requires destination" }
);

/** Zod schema for pre-selected cities from Haiku route selection. */
export const CityWithDaysInputSchema = z.object({
  id: z.string(),
  city: z.string(),
  country: z.string(),
  countryCode: z.string(),
  iataCode: z.string(),
  lat: z.number(),
  lng: z.number(),
  minDays: z.number(),
  maxDays: z.number(),
});
