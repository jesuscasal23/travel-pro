"use client";

import { createContext, useContext } from "react";
import type { ActivityDiscoveryCandidate, DiscoveryStatus, Itinerary } from "@/types";

export interface TripContextValue {
  // Core trip identity
  itinerary: Itinerary;
  tripId: string;
  tripTitle: string;
  totalDays: number;
  countries: string[];
  isAuthenticated: boolean | null;

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

  // Activity discovery swipe flow
  discoveryStatus: DiscoveryStatus;
  discoveryCards: ActivityDiscoveryCandidate[];
  discoveryCursor: number;
  discoveryTotalTarget: number;
  discoveryIsLoading: boolean;
  discoveryHasPendingBatches: boolean;
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
