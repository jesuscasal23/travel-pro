// ============================================================
// Travel Pro — Itinerary Validation Layer
// Runs after LLM output, before writing to Supabase
// ============================================================

import type { Itinerary, DayActivity } from "@/types";

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  missingFields: MissingField[];
}

export interface MissingField {
  day: number;
  activityIndex: number;
  activityName: string;
  missingFields: string[];
}

const REQUIRED_FIELDS: (keyof DayActivity)[] = [
  "name", "why", "duration", "tip", "food", "cost", "category", "icon",
];

/**
 * Validate a generated itinerary against Travel Pro quality rules.
 * Returns errors (blocking) and warnings (non-blocking).
 */
export function validateItinerary(
  itinerary: Itinerary,
  budgetCeiling: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: MissingField[] = [];

  // ── 1. Completeness ───────────────────────────────────────
  for (const day of itinerary.days ?? []) {
    if (day.isTravel) continue;

    for (let i = 0; i < (day.activities?.length ?? 0); i++) {
      const activity = day.activities[i];
      const missing = REQUIRED_FIELDS.filter(
        (f) => !activity[f] || String(activity[f]).trim() === ""
      );

      if (missing.length > 0) {
        missingFields.push({
          day: day.day,
          activityIndex: i,
          activityName: activity.name || `Activity ${i + 1}`,
          missingFields: missing,
        });
      }
    }
  }

  if (missingFields.length > 0) {
    errors.push(
      `${missingFields.length} activities missing required fields: ` +
        missingFields
          .map((m) => `Day ${m.day} "${m.activityName}" [${m.missingFields.join(", ")}]`)
          .join("; ")
    );
  }

  // ── 2. Route integrity ─────────────────────────────────────
  if (!itinerary.route || itinerary.route.length === 0) {
    errors.push("Route is empty");
  } else {
    const names = itinerary.route.map((c) => c.city.toLowerCase());
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length > 0) {
      warnings.push(`Duplicate cities: ${[...new Set(dupes)].join(", ")}`);
    }

    const countries = itinerary.route.map((c) => c.country);
    for (let i = 0; i < countries.length - 2; i++) {
      for (let j = i + 2; j < countries.length; j++) {
        if (countries[i] === countries[j] && countries[i] !== countries[i + 1]) {
          warnings.push(
            `Route backtracking: ${countries[i]} at positions ${i + 1} and ${j + 1}`
          );
          break;
        }
      }
    }
  }

  // ── 3. Budget ──────────────────────────────────────────────
  if (!itinerary.budget) {
    errors.push("Budget data is missing");
  } else {
    const pct = (itinerary.budget.total / budgetCeiling) * 100;
    if (pct > 105) {
      warnings.push(
        `Budget exceeds ceiling by ${Math.round(pct - 100)}%: ` +
          `€${itinerary.budget.total.toLocaleString()} vs €${budgetCeiling.toLocaleString()}`
      );
    }
  }

  // ── 4. Days count ──────────────────────────────────────────
  if (!itinerary.days || itinerary.days.length === 0) {
    errors.push("No days generated");
  }

  return { valid: errors.length === 0, warnings, errors, missingFields };
}

/**
 * Build a targeted retry prompt for activities with missing fields.
 */
export function buildRetryPrompt(missingFields: MissingField[]): string {
  const items = missingFields
    .map(
      (m) =>
        `- Day ${m.day}, activity "${m.activityName}": add missing fields [${m.missingFields.join(", ")}]`
    )
    .join("\n");

  return `These activities are missing required fields. Return ONLY a JSON array of corrected objects:

${items}

Each corrected activity must include ALL 8 required fields: name, category, icon, why, duration, tip, food, cost.
Return only the JSON array, no explanation.`;
}
