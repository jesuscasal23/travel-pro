import { z } from "zod";

// ============================================================
// Travel Pro — Zod Schemas
//
// Two groups:
//   API Input Schemas — validate request bodies in API routes
//   Form Schemas      — validate user input in page components
// ============================================================

// ── API Input Schemas ────────────────────────────────────────
// Used by route handlers to validate incoming request bodies.

/** Zod schema for profile data sent with generation requests. */
export const ProfileInputSchema = z.object({
  nationality: z.string().min(1).max(100),
  homeAirport: z.string().min(2).max(100),
  travelStyle: z.enum(["backpacker", "comfort", "luxury"]),
  interests: z.array(z.string().max(50)).max(10),
  // pace controls how many activities per day are generated (relaxed/moderate/active)
  pace: z.enum(["relaxed", "moderate", "active"]).optional(),
});

/** Zod schema for trip intent data shared across generation endpoints. */
export const TripIntentInputSchema = z
  .object({
    id: z.string().max(100),
    tripType: z.enum(["single-city", "single-country", "multi-city"]).default("multi-city"),
    region: z.string().max(100).default(""),
    destination: z.string().max(100).optional(),
    destinationCountry: z.string().max(100).optional(),
    destinationCountryCode: z.string().max(10).optional(),
    destinationLat: z.number().optional(),
    destinationLng: z.number().optional(),
    dateStart: z.string().max(20),
    dateEnd: z.string().max(20),
    flexibleDates: z.boolean().default(false),
    travelers: z.number().int().min(1).max(20),
  })
  .refine(
    (d) => {
      if (d.tripType === "multi-city") return d.region.length > 0;
      if (d.tripType === "single-country") return !!d.destinationCountry;
      return !!d.destination; // single-city
    },
    {
      message:
        "Multi-country trips require region; single-country requires country; single-city requires destination",
    }
  );

/** Zod schema for pre-selected cities from Haiku route selection. */
export const CityWithDaysInputSchema = z.object({
  id: z.string(),
  city: z.string(),
  country: z.string(),
  countryCode: z.string(),
  iataCode: z.string(),
  lat: z.number(),
  lng: z.number(),
  minDays: z.number(),
  maxDays: z.number(),
});

/** Zod schema for on-demand flight search requests. */
export const FlightSearchInputSchema = z.object({
  fromIata: z.string().length(3).toUpperCase(),
  toIata: z.string().length(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  travelers: z.number().int().min(1).max(20),
  nonStop: z.boolean().optional(),
  maxPrice: z.number().int().min(1).optional(),
});

// ── Form Schemas ─────────────────────────────────────────────
// Used by page components (onboarding, plan, profile) for
// client-side and server-side form validation.

/** Profile fields (reused by onboarding, profile page, and plan guest steps). */
const profileSchema = z.object({
  nationality: z.string().min(1, "Please select your nationality"),
  homeAirport: z.string().min(2, "Please select your home airport"),
  travelStyle: z.enum(["backpacker", "comfort", "luxury"]),
  interests: z.array(z.string()).max(10),
});

/** Alias for profileSchema — used by the profile settings page. */
export const profileSaveSchema = profileSchema;

/** Plan step 1: destination, trip type, and dates. */
export const destinationStepSchema = z
  .object({
    tripType: z.enum(["single-city", "single-country", "multi-city"]),
    region: z.string(),
    destination: z.string(),
    destinationCountry: z.string(),
    dateStart: z.string().min(1, "Please select a start date"),
    dateEnd: z.string().min(1, "Please select an end date"),
  })
  .refine((d) => d.tripType !== "multi-city" || d.region.length > 0, {
    message: "Please select a region",
    path: ["region"],
  })
  .refine((d) => d.tripType !== "single-city" || d.destination.length > 0, {
    message: "Please select a city",
    path: ["destination"],
  })
  .refine((d) => d.tripType !== "single-country" || d.destinationCountry.length > 0, {
    message: "Please select a country",
    path: ["destinationCountry"],
  })
  .refine(
    (d) => {
      if (!d.dateStart || !d.dateEnd) return true;
      return new Date(d.dateEnd) > new Date(d.dateStart);
    },
    { message: "End date must be after start date", path: ["dateEnd"] }
  );

/** Plan step 2: traveler count. */
export const detailsStepSchema = z.object({
  travelers: z.number().int().min(1, "At least 1 traveler").max(10, "Maximum 10 travelers"),
});

/** Onboarding step 1: nationality + home airport. */
export const onboardingStep1Schema = z.object({
  nationality: z.string().min(1, "Please select your nationality"),
  homeAirport: z.string().min(2, "Please select your home airport"),
});

// ── Validation Helper ────────────────────────────────────────

/**
 * Validate data against a Zod schema.
 * Returns a flat `{ fieldName: errorMessage }` map, or `null` if valid.
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): Record<string, string> | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0]?.toString() ?? "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
