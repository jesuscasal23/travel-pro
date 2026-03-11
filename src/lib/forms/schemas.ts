import { z } from "zod";

// ============================================================
// Travel Pro — Form Validation Schemas
//
// Client-side and server-side form validation used by page
// components (onboarding, plan, profile).
// ============================================================

/** Profile fields reused by the profile page and planner profile step. */
const profileSchema = z.object({
  nationality: z.string().min(1, "Please select your nationality"),
  homeAirport: z.string().min(2, "Please select your home airport"),
  travelStyle: z.enum(["backpacker", "comfort", "luxury"]),
  interests: z.array(z.string()).max(10),
});

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

/** Planner profile step: nationality + home airport. */
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
