import { z } from "zod";

export const ProfileInputSchema = z.object({
  nationality: z.string().min(1).max(100),
  homeAirport: z.string().min(2).max(100),
  travelStyle: z.enum(["backpacker", "smart-budget", "comfort-explorer", "luxury"]),
  interests: z.array(z.string().max(50)).max(10),
  pace: z.enum(["relaxed", "moderate", "active"]).optional(),
});

export const TripIntentInputSchema = z
  .object({
    id: z.string().max(100),
    tripType: z.enum(["single-city", "multi-city"]).default("multi-city"),
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
