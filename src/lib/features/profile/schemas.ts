import { z } from "zod";

export const ProfilePatchInputSchema = z.object({
  nationality: z.string().min(1).optional(),
  homeAirport: z.string().min(1).optional(),
  travelStyle: z.enum(["backpacker", "smart-budget", "comfort-explorer", "luxury"]).optional(),
  interests: z.array(z.string()).optional(),
  pace: z.enum(["relaxed", "moderate", "active"]).optional(),
  activityLevel: z.enum(["low", "moderate", "high"]).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  onboardingCompleted: z.boolean().optional(),
});
