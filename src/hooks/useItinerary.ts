import { useTripStore } from "@/stores/useTripStore";
import type { Itinerary } from "@/types";

/**
 * Returns the current itinerary from the store, or null if none is loaded.
 */
export function useItinerary(): Itinerary | null {
  return useTripStore((s) => s.itinerary);
}
