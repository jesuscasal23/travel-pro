import { travelInputClass } from "@/components/forms/travel-field-styles";
import type { ActivityPace } from "@/types";

export const profileInputClass = travelInputClass;

export const paceOptions: { id: ActivityPace; title: string; description: string }[] = [
  { id: "relaxed", title: "Relaxed", description: "Fewer things, more breathing room." },
  { id: "moderate", title: "Balanced", description: "A healthy mix of movement and downtime." },
  { id: "active", title: "Active", description: "Pack the days and see as much as possible." },
];
