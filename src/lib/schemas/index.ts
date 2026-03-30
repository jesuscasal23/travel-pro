import { z } from "zod";
import { cityGeoSchema } from "@/lib/itinerary/schema";

// ── Enum primitives ────────────────────────────────────────────

export const travelStyleSchema = z.enum([
  "backpacker",
  "smart-budget",
  "comfort-explorer",
  "luxury",
]);

const paceSchema = z.enum(["relaxed", "moderate", "active"]);

const activityLevelSchema = z.enum(["low", "moderate", "high"]);

export const tripTypeSchema = z.enum(["single-city", "multi-city"]);

// ── Vibe scores ────────────────────────────────────────────────

const vibeScoresSchema = z.object({
  adventureComfort: z.number().min(0).max(100),
  socialQuiet: z.number().min(0).max(100),
  luxuryBudget: z.number().min(0).max(100),
  structuredSpontaneous: z.number().min(0).max(100),
  warmMixed: z.number().min(0).max(100),
});

// ── Profile schemas ────────────────────────────────────────────

const profileCore = z.object({
  nationality: z.string().min(1).max(100),
  homeAirport: z.string().min(2).max(100),
  travelStyle: travelStyleSchema,
  interests: z.array(z.string().max(50)).max(10),
  pace: paceSchema.optional(),
});

/** Profile shape sent to AI endpoints (activity discovery). */
export const profileForAISchema = profileCore;

/** All profile fields, all optional — used for PATCH updates. */
export const profilePatchSchema = profileCore
  .extend({
    activityLevel: activityLevelSchema.optional(),
    vibes: vibeScoresSchema.optional(),
    languagesSpoken: z.array(z.string()).optional(),
    onboardingCompleted: z.boolean().optional(),
    lastSeenAppVersion: z.string().optional(),
  })
  .partial();

// ── CityStop input schema ──────────────────────────────────────

/** cityGeoSchema + id/days/iataCode — shared across trip, optimize, and enrichment inputs. */
export const cityStopInputSchema = cityGeoSchema.extend({
  id: z.string(),
  days: z.number().optional(),
  iataCode: z.string().optional(),
});
