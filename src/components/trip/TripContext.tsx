"use client";

import { createContext, useContext } from "react";
import type {
  ActivityDiscoveryCandidate,
  CityAccommodation,
  DiscoveryStatus,
  Itinerary,
} from "@/types";

export interface TripContextValue {
  // Core trip identity
  itinerary: Itinerary;
  tripId: string;
  tripTitle: string;
  totalDays: number;
  countries: string[];
  isAuthenticated: boolean | null;

  // Trip dates and party size (from DB, not from form store)
  dateStart: string;
  travelers: number;

  // Generation state
  isPartialItinerary: boolean;
  isGenerating: boolean;
  generationError: string | null;
  needsRegeneration: boolean;
  onRetry: () => void;
  onRegenerate: () => void;
  onDismissRegeneration: () => void;

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
  onDiscoverySwipe: (decision: "liked" | "disliked") => void;
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
