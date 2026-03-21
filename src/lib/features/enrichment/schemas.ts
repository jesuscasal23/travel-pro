import { z } from "zod";
import { cityGeoSchema } from "@/lib/itinerary/schema";

export const EnrichWeatherInputSchema = z.object({
  route: z.array(cityGeoSchema).min(1).max(20),
  dateStart: z.string().min(1).max(20),
});

export const EnrichVisaInputSchema = z.object({
  nationality: z.string().min(1).max(100),
  route: z.array(cityGeoSchema).min(1).max(20),
});

export const EnrichAccommodationInputSchema = z.object({
  route: z
    .array(
      cityGeoSchema.extend({
        id: z.string(),
        days: z.number(),
        iataCode: z.string().optional(),
      })
    )
    .min(1)
    .max(20),
  dateStart: z.string().min(1).max(20),
  travelers: z.number().int().min(1).max(20),
  travelStyle: z.enum(["backpacker", "smart-budget", "comfort-explorer", "luxury"]),
});
