// ============================================================
// Travel Pro — AI Model Selector
// Routes generation tasks to the optimal model (cost vs quality)
// ============================================================

export type GenerationTask =
  | "full_itinerary"    // Complete trip from scratch
  | "city_activities"   // Generate activities for one new city
  | "single_day_regen"  // Regenerate one day's activities
  | "budget_recalc";    // Recalculate budget after edit

export const MODELS = {
  SONNET: "claude-sonnet-4-20250514",  // Best quality, ~$0.09/full trip
  HAIKU: "claude-haiku-4-5-20251001",  // 5x cheaper, fast for partial tasks
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/** Select the optimal model for a generation task. */
export function selectModel(task: GenerationTask): ModelId {
  switch (task) {
    case "full_itinerary":    return MODELS.SONNET;
    case "city_activities":   return MODELS.HAIKU;
    case "single_day_regen":  return MODELS.HAIKU;
    case "budget_recalc":     return MODELS.HAIKU;
    default:                  return MODELS.SONNET;
  }
}

/** Max output tokens per task. */
export function getMaxTokens(task: GenerationTask): number {
  switch (task) {
    case "full_itinerary":   return 8000;
    case "city_activities":  return 2000;
    case "single_day_regen": return 1000;
    case "budget_recalc":    return 500;
    default:                 return 8000;
  }
}

/** Temperature per task — lower for reliable JSON. */
export function getTemperature(task: GenerationTask): number {
  switch (task) {
    case "full_itinerary":   return 0.4; // v2: lower for reliability
    case "city_activities":  return 0.5;
    case "single_day_regen": return 0.5;
    case "budget_recalc":    return 0.1; // Near-deterministic
    default:                 return 0.4;
  }
}
