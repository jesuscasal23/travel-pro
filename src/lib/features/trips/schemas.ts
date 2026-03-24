import { z } from "zod";
import { cityGeoSchema, itineraryCoreSchema } from "@/lib/itinerary/schema";

export const CreateTripInputSchema = z.object({
  tripType: z.enum(["single-city", "single-country", "multi-city"]).default("multi-city"),
  region: z.string().max(100).default(""),
  destination: z.string().max(100).optional(),
  destinationCountry: z.string().max(100).optional(),
  destinationCountryCode: z.string().max(10).optional(),
  dateStart: z.string().max(20),
  dateEnd: z.string().max(20),
  flexibleDates: z.boolean().default(false),
  travelers: z.number().int().min(1).max(20).default(2),
  description: z.string().max(2000).optional(),
  initialItinerary: itineraryCoreSchema.optional(),
});

const RouteStopInputSchema = cityGeoSchema.extend({
  id: z.string(),
  days: z.number().optional(),
  iataCode: z.string().optional(),
});

export const OptimizeTripInputSchema = z.object({
  homeAirport: z.string().min(1),
  route: z.array(RouteStopInputSchema.extend({ days: z.number() })).min(1),
  dateStart: z.string().min(1).max(20),
  dateEnd: z.string().min(1).max(20),
  travelers: z.number().int().min(1).max(20).optional(),
});

export const FlightSearchInputSchema = z.object({
  fromIata: z.string().length(3).toUpperCase(),
  toIata: z.string().length(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  travelers: z.number().int().min(1).max(20),
  nonStop: z.boolean().optional(),
  maxPrice: z.number().int().min(1).optional(),
});

export const ActivityDiscoveryCardSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().min(1).max(600),
  category: z.string().min(1).max(80),
  duration: z.string().min(1).max(40),
  googleMapsUrl: z.string().url(),
  imageUrl: z.null(),
});

export const DiscoverActivitiesInputSchema = z.object({
  profile: z
    .object({
      nationality: z.string().min(1).max(100),
      homeAirport: z.string().min(2).max(100),
      travelStyle: z.enum(["backpacker", "smart-budget", "comfort-explorer", "luxury"]),
      interests: z.array(z.string().max(50)).max(10),
    })
    .optional(),
  cityId: z.string().min(1).max(100),
  batchIndex: z.number().int().min(0).max(4),
});

export const RecordActivitySwipeInputSchema = z.object({
  decision: z.enum(["liked", "disliked"]),
  activity: ActivityDiscoveryCardSchema,
  destination: z.string().min(1).max(160),
  isFinal: z.boolean().optional(),
});
