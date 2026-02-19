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
  region: z.string().min(1).max(100),
  dateStart: z.string().max(20),
  dateEnd: z.string().max(20),
  flexibleDates: z.boolean(),
  budget: z.number().positive().max(1_000_000),
  vibe: z.enum(["relaxation", "adventure", "cultural", "mix"]),
  travelers: z.number().int().min(1).max(20),
});

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
