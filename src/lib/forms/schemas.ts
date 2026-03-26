import { z } from "zod";

// ============================================================
// Travel Pro — Form Validation Schemas
//
// Client-side and server-side form validation used by page
// components (onboarding, plan, profile).
// ============================================================

/** Plan step 1: selected cities and dates. */
export const destinationStepSchema = z
  .object({
    selectedCities: z
      .array(z.object({ city: z.string() }).passthrough())
      .min(1, "Please add at least one city"),
    dateStart: z.string().min(1, "Please select a start date"),
    dateEnd: z.string().min(1, "Please select an end date"),
  })
  .refine(
    (d) => {
      if (!d.dateStart || !d.dateEnd) return true;
      return new Date(d.dateEnd) > new Date(d.dateStart);
    },
    { message: "End date must be after start date", path: ["dateEnd"] }
  );

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
