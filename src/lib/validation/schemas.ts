import { z } from "zod";

// ── Profile (reused by onboarding, profile page, and plan guest steps) ──────
export const profileSchema = z.object({
  nationality: z.string().min(1, "Please select your nationality"),
  homeAirport: z.string().min(2, "Please select your home airport"),
  travelStyle: z.enum(["backpacker", "comfort", "luxury"]),
  interests: z.array(z.string()).max(10),
});

// ── Plan Step: Destination ──────────────────────────────────────────────────
export const destinationStepSchema = z
  .object({
    tripType: z.enum(["single-city", "single-country", "multi-city"]),
    region: z.string(),
    destination: z.string(),
    destinationCountry: z.string(),
    dateStart: z.string().min(1, "Please select a start date"),
    dateEnd: z.string().min(1, "Please select an end date"),
  })
  .refine(
    (d) => d.tripType !== "multi-city" || d.region.length > 0,
    { message: "Please select a region", path: ["region"] },
  )
  .refine(
    (d) => d.tripType !== "single-city" || d.destination.length > 0,
    { message: "Please select a city", path: ["destination"] },
  )
  .refine(
    (d) => d.tripType !== "single-country" || d.destinationCountry.length > 0,
    { message: "Please select a country", path: ["destinationCountry"] },
  )
  .refine(
    (d) => {
      if (!d.dateStart || !d.dateEnd) return true;
      return new Date(d.dateEnd) > new Date(d.dateStart);
    },
    { message: "End date must be after start date", path: ["dateEnd"] },
  );

// ── Plan Step: Details ──────────────────────────────────────────────────────
export const detailsStepSchema = z.object({
  budget: z.number().min(1000, "Budget must be at least €1,000"),
  travelers: z
    .number()
    .int()
    .min(1, "At least 1 traveler")
    .max(10, "Maximum 10 travelers"),
});

// ── Onboarding step 1 ──────────────────────────────────────────────────────
export const onboardingStep1Schema = z.object({
  nationality: z.string().min(1, "Please select your nationality"),
  homeAirport: z.string().min(2, "Please select your home airport"),
});

// ── Profile save ────────────────────────────────────────────────────────────
export const profileSaveSchema = profileSchema;

// ── Validation helper ───────────────────────────────────────────────────────

/**
 * Validate data against a Zod schema.
 * Returns a flat `{ fieldName: errorMessage }` map, or `null` if valid.
 */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
): Record<string, string> | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0]?.toString() ?? "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
