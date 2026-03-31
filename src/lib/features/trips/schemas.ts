import { z } from "zod";
import { itineraryCoreSchema } from "@/lib/itinerary/schema";
import { profileForAISchema, cityStopInputSchema, tripTypeSchema } from "@/lib/schemas";

export const CreateTripInputSchema = z.object({
  tripType: z.enum(["single-city", "multi-city"]).default("multi-city"),
  region: z.string().max(100).default(""),
  destination: z.string().max(100).optional(),
  destinationCountry: z.string().max(100).optional(),
  destinationCountryCode: z.string().max(10).optional(),
  dateStart: z.string().max(20),
  dateEnd: z.string().max(20),
  travelers: z.number().int().min(1).max(20).default(2),
  tripDirection: z.enum(["return", "one-way"]).optional(),
  description: z.string().max(2000).optional(),
  initialItinerary: itineraryCoreSchema.optional(),
});

export const OptimizeTripInputSchema = z.object({
  homeAirport: z.string().min(1),
  route: z.array(cityStopInputSchema.extend({ days: z.number() })).min(1),
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

export const DiscoverActivitiesInputSchema = z.object({
  profile: profileForAISchema.optional(),
  cityId: z.string().min(1).max(100),
  excludeNames: z.array(z.string()).optional(),
});

export const RecordActivitySwipeInputSchema = z.object({
  activityId: z.string().min(1),
  decision: z.enum(["liked", "disliked"]),
  cityId: z.string().min(1),
});

export const TripIntentInputSchema = z
  .object({
    id: z.string().max(100),
    tripType: tripTypeSchema.default("multi-city"),
    region: z.string().max(100).default(""),
    destination: z.string().max(100).optional(),
    destinationCountry: z.string().max(100).optional(),
    destinationCountryCode: z.string().max(10).optional(),
    destinationLat: z.number().optional(),
    destinationLng: z.number().optional(),
    dateStart: z.string().max(20),
    dateEnd: z.string().max(20),
    travelers: z.number().int().min(1).max(20),
  })
  .refine(
    (data) => {
      if (data.tripType === "multi-city") return true; // cities provided separately via route
      return !!data.destination;
    },
    {
      message: "Single-city trips require a destination",
    }
  );
