import { z } from "zod";
import { itinerarySchema } from "@/lib/itinerary/schema";

export const ProfileInputSchema = z.object({
  nationality: z.string().min(1).max(100),
  homeAirport: z.string().min(2).max(100),
  travelStyle: z.enum(["backpacker", "comfort", "luxury"]),
  interests: z.array(z.string().max(50)).max(10),
  pace: z.enum(["relaxed", "moderate", "active"]).optional(),
});

export const TripIntentInputSchema = z
  .object({
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
  })
  .refine(
    (data) => {
      if (data.tripType === "multi-city") return data.region.length > 0;
      if (data.tripType === "single-country") return !!data.destinationCountry;
      return !!data.destination;
    },
    {
      message:
        "Multi-country trips require region; single-country requires country; single-city requires destination",
    }
  );

export const SelectRouteInputSchema = z.object({
  profile: ProfileInputSchema,
  tripIntent: TripIntentInputSchema,
});

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

export const PromptVersionSchema = z.literal("v1").default("v1");

export const GenerateTripInputSchema = z.object({
  profile: ProfileInputSchema,
  promptVersion: PromptVersionSchema,
  cities: z.array(CityWithDaysInputSchema).optional(),
});

export const GenerateActivitiesInputSchema = z.object({
  profile: ProfileInputSchema,
  cityId: z.string().min(1).max(100),
});

export const EditItineraryInputSchema = z.object({
  editType: z.enum([
    "adjust_days",
    "remove_city",
    "reorder_cities",
    "add_city",
    "regenerate_activities",
  ]),
  editPayload: z.record(z.string(), z.unknown()),
  description: z.string().optional(),
  data: itinerarySchema.optional(),
});
