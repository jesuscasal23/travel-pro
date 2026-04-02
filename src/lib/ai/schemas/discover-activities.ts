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
  reachableMinutes: z.number().min(1).max(180).optional(),
});

// Prompt asks for exactly 25, but Haiku consistently overshoots by 1-2.
// Allow up to 30 to avoid rejecting otherwise valid responses.
export const ClaudeDiscoverActivitiesOutputSchema = z.array(ClaudeDiscoverActivitySchema).max(30);
