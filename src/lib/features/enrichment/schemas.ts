import { z } from "zod";

export const EnrichWeatherInputSchema = z.object({
  route: z
    .array(
      z.object({
        city: z.string(),
        country: z.string(),
        countryCode: z.string(),
        lat: z.number(),
        lng: z.number(),
      })
    )
    .min(1)
    .max(20),
  dateStart: z.string().min(1).max(20),
});

export const EnrichVisaInputSchema = z.object({
  nationality: z.string().min(1).max(100),
  route: z
    .array(
      z.object({
        city: z.string(),
        country: z.string(),
        countryCode: z.string(),
        lat: z.number(),
        lng: z.number(),
      })
    )
    .min(1)
    .max(20),
});

export const EnrichAccommodationInputSchema = z.object({
  route: z
    .array(
      z.object({
        id: z.string(),
        city: z.string(),
        country: z.string(),
        countryCode: z.string(),
        lat: z.number(),
        lng: z.number(),
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
