import { z } from "zod";

const VibeScoresSchema = z.object({
  adventureComfort: z.number().min(0).max(100),
  socialQuiet: z.number().min(0).max(100),
  luxuryBudget: z.number().min(0).max(100),
  structuredSpontaneous: z.number().min(0).max(100),
  warmMixed: z.number().min(0).max(100),
});

export const ProfilePatchInputSchema = z.object({
  nationality: z.string().min(1).optional(),
  homeAirport: z.string().min(1).optional(),
  travelStyle: z.enum(["backpacker", "smart-budget", "comfort-explorer", "luxury"]).optional(),
  interests: z.array(z.string()).optional(),
  pace: z.enum(["relaxed", "moderate", "active"]).optional(),
  activityLevel: z.enum(["low", "moderate", "high"]).optional(),
  vibes: VibeScoresSchema.optional(),
  languagesSpoken: z.array(z.string()).optional(),
  onboardingCompleted: z.boolean().optional(),
});
