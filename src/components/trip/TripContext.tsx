"use client";

import { createContext, useContext } from "react";
import type {
  ActivityDiscoveryCandidate,
  AssignedActivity,
  CityAccommodation,
  DiscoveryStatus,
  Itinerary,
} from "@/types";

export interface TripContextValue {
  // Core trip identity
  itinerary: Itinerary | null;
  tripId: string;
  tripTitle: string;
  totalDays: number;
  countries: string[];
  isAuthenticated: boolean | null;

  // Trip dates and party size (from DB, not from form store)
  dateStart: string;
  dateEnd: string;
  travelers: number;
  tripDirection: string; // "return" | "one-way"

  // Itinerary build state
  // isBuilding / buildError are reserved for future use; currently always false/null.
  // isPartialItinerary is true while the skeleton has no activities yet.
  // needsRebuild is set when the user edits the route and activities are stale.
  isPartialItinerary: boolean;
  isBuilding: boolean;
  buildError: string | null;
  needsRebuild: boolean;
  onRetry: () => void;
  onRebuild: () => void;
  onDismissRebuild: () => void;

  // Enrichment state
  visaLoading: boolean;
  weatherLoading: boolean;
  visaError: boolean;
  weatherError: boolean;
  accommodationLoading: boolean;
  accommodationError: boolean;
  /** Called by AccommodationTab after a manual refetch to update the itinerary. */
  onAccommodationLoaded: (data: CityAccommodation[]) => void;

  // Activity discovery swipe flow
  discoveryStatus: DiscoveryStatus;
  discoveryCards: ActivityDiscoveryCandidate[];
  discoveryCursor: number;
  discoveryTotalTarget: number;
  discoveryIsLoading: boolean;
  discoveryError: string | null;
  discoveryNotice: string | null;
  onDiscoverySwipe: (decision: "liked" | "disliked") => void;

  // Multi-city discovery progress
  discoveryCityIndex: number;
  discoveryTotalCities: number;
  discoveryLikedCount: number;
  discoveryRequiredCount: number;
  discoveryRoundLimitReached: boolean;

  // Assigned activities (populated after discovery completes)
  assignedActivities: AssignedActivity[];
}

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({
  value,
  children,
}: {
  value: TripContextValue;
  children: React.ReactNode;
}) {
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTripContext(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) {
    throw new Error("useTripContext must be used within a <TripProvider>");
  }
  return ctx;
}
