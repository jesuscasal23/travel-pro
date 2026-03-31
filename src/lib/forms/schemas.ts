import { z } from "zod";

// ============================================================
// Fichi — Form Validation Schemas
//
// Client-side and server-side form validation used by page
// components (onboarding, plan, profile).
// ============================================================

/** Plan step 1: selected cities and dates (exact or flexible). */
export const destinationStepSchema = z
  .object({
    selectedCities: z
      .array(z.object({ city: z.string() }).passthrough())
      .min(1, "Please add at least one city"),
    dateMode: z.enum(["exact", "flexible"]).default("exact"),
    dateStart: z.string().default(""),
    dateEnd: z.string().default(""),
    dayCount: z.number().default(7),
  })
  .refine((d) => d.dateStart.length > 0, {
    message: "Please select a start date",
    path: ["dateStart"],
  })
  .refine(
    (d) => {
      if (d.dateMode === "flexible") return true; // end date optional in flexible mode
      return d.dateEnd.length > 0;
    },
    { message: "Please select an end date", path: ["dateEnd"] }
  )
  .refine(
    (d) => {
      if (d.dateMode === "flexible") return true;
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
