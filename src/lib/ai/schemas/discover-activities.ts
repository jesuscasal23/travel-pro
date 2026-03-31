import { z } from "zod";

export const ClaudeDiscoverActivitySchema = z.object({
  name: z.string().min(1).max(160),
  placeName: z.string().min(1).max(200),
  venueType: z.string().min(1).max(120),
  description: z.string().min(1).max(600),
  highlights: z.array(z.string().min(1).max(200)).min(1).max(5),
  category: z.string().min(1).max(80),
  duration: z.string().min(1).max(40),
  lat: z.number(),
  lng: z.number(),
});

export const ClaudeDiscoverActivitiesOutputSchema = z.array(ClaudeDiscoverActivitySchema).max(25);
