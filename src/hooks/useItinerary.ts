import { useTripStore } from "@/stores/useTripStore";
import { sampleFullItinerary } from "@/data/sampleData";
import type { Itinerary } from "@/types";

/**
 * Returns the current itinerary from the store, falling back to sampleData.
 * All trip pages use this so they display AI-generated data when available
 * and demo data otherwise.
 */
export function useItinerary(): Itinerary {
  const storeItinerary = useTripStore((s) => s.itinerary);
  return storeItinerary ?? sampleFullItinerary;
}
