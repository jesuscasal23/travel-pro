import { z } from "zod";

/** Zod schema for profile data sent with generation requests. */
export const ProfileInputSchema = z.object({
  nationality: z.string().min(1).max(100),
  homeAirport: z.string().min(2).max(100),
  travelStyle: z.enum(["backpacker", "comfort", "luxury"]),
  interests: z.array(z.string().max(50)).max(10),
});
