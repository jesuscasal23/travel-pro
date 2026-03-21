import { z } from "zod";

export const AffiliateRedirectQuerySchema = z.object({
  provider: z.enum(["skyscanner", "booking", "getyourguide"]),
  type: z.enum(["flight", "hotel", "activity"]),
  dest: z.string().url("dest must be a valid URL"),
  itinerary_id: z.string().optional(),
  city: z.string().optional(),
  metadata: z.string().optional(),
});
