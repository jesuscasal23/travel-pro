/** Steps displayed during itinerary generation loading screen */
export const generationSteps = [
  { emoji: "🧭", label: "Generating your route..." },
  { emoji: "📅", label: "Planning daily activities..." },
  { emoji: "🛂", label: "Checking visa requirements..." },
  { emoji: "🌤️", label: "Analyzing weather patterns..." },
  { emoji: "💰", label: "Calculating your budget..." },
  { emoji: "✅", label: "Your trip is ready!" },
] as const;

/** Time between each generation step in ms */
export const GENERATION_STEP_INTERVAL = 3500;

/** Delay after final step before navigation in ms */
export const GENERATION_COMPLETE_DELAY = 600;
