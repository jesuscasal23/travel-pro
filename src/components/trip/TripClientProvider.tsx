"use client";

import { TripProvider, type TripContextValue } from "@/components/trip/TripContext";
import { useShallow } from "zustand/shallow";
import { useTripStore } from "@/stores/useTripStore";
import type { ReactNode } from "react";
import { useTripIdentity } from "./provider/useTripIdentity";
import { useItinerarySync } from "./provider/useItinerarySync";
import { useDiscoveryFlow } from "./provider/useDiscoveryFlow";
import { useEnrichmentPipeline } from "./provider/useEnrichmentPipeline";
import { useTripGuards } from "./provider/useTripGuards";

interface TripClientProviderProps {
  tripId: string;
  children: ReactNode;
}

export function TripClientProvider({ tripId, children }: TripClientProviderProps) {
  const { needsRebuild, setNeedsRebuild } = useTripStore(
    useShallow((s) => ({
      needsRebuild: s.needsRebuild,
      setNeedsRebuild: s.setNeedsRebuild,
    }))
  );

  const tripIdentity = useTripIdentity({ tripId });

  const itineraryState = useItinerarySync({
    tripId,
    tripData: tripIdentity.tripData,
    tripQueryPending: tripIdentity.tripQuery.isPending,
    tripQueryEnabled: !tripIdentity.isGuest,
    tripTitleFallback: tripIdentity.tripData?.destination ?? "Untitled Trip",
    dateStart: tripIdentity.dateStart,
    dateEnd: tripIdentity.dateEnd,
  });

  const enrichment = useEnrichmentPipeline({
    itinerary: itineraryState.itinerary,
    setItinerary: itineraryState.setItinerary,
    route: itineraryState.route,
    nationality: tripIdentity.nationality,
    dateStart: tripIdentity.dateStart,
    travelers: tripIdentity.travelers ?? 2,
    travelStyle: tripIdentity.travelStyle,
  });

  const discovery = useDiscoveryFlow({
    tripId,
    itinerary: itineraryState.itinerary,
    serverDiscoveryStatus: tripIdentity.serverDiscoveryStatus,
    hasDiscoveryProfile: tripIdentity.hasDiscoveryProfile,
    requestProfile: tripIdentity.requestProfile,
    isGuest: tripIdentity.isGuest,
  });

  const guard = useTripGuards({
    tripSyncPending: tripIdentity.tripSyncPending,
    tripUnavailable: tripIdentity.tripUnavailable,
    tripQueryStatus: tripIdentity.tripQueryStatus,
    tripQuery: tripIdentity.tripQuery,
    isAuthenticated: tripIdentity.isAuthenticated ?? undefined,
    itinerary: itineraryState.itinerary,
    isGuest: tripIdentity.isGuest,
  });

  if (guard) {
    return guard;
  }

  const contextValue: TripContextValue = {
    itinerary: itineraryState.itinerary ?? null,
    tripId,
    tripTitle: itineraryState.tripTitle,
    totalDays: itineraryState.totalDays,
    countries: itineraryState.countries,
    isAuthenticated: tripIdentity.isAuthenticated,
    dateStart: tripIdentity.dateStart ?? "",
    dateEnd: tripIdentity.dateEnd ?? "",
    travelers: tripIdentity.travelers ?? 2,
    tripDirection: tripIdentity.tripDirection ?? "return",
    isPartialItinerary: false,
    isBuilding: false,
    buildError: null,
    needsRebuild,
    onRetry: () => undefined,
    onRebuild: () => setNeedsRebuild(false),
    onDismissRebuild: () => setNeedsRebuild(false),
    visaLoading: enrichment.visaLoading,
    weatherLoading: enrichment.weatherLoading,
    visaError: enrichment.visaError,
    weatherError: enrichment.weatherError,
    accommodationLoading: enrichment.accommodationLoading,
    accommodationError: enrichment.accommodationError,
    onAccommodationLoaded: itineraryState.onAccommodationLoaded,
    discoveryStatus: discovery.discoveryStatus,
    discoveryCards: discovery.discoveryCardsWithImages,
    discoveryCursor: discovery.discoveryCursor,
    discoveryTotalTarget: discovery.discoveryTotalTarget,
    discoveryIsLoading: discovery.discoveryIsLoading,
    discoveryError: discovery.discoveryError,
    discoveryNotice: discovery.discoveryNotice,
    onDiscoverySwipe: discovery.onDiscoverySwipe,
    discoveryCityIndex: discovery.discoveryCityIndex,
    discoveryTotalCities: discovery.discoveryTotalCities,
    discoveryLikedCount: discovery.discoveryLikedCount,
    discoveryRequiredCount: discovery.discoveryRequiredCount,
    discoveryRoundLimitReached: discovery.discoveryRoundLimitReached,
    assignedActivities: tripIdentity.assignedActivities,
  };

  return <TripProvider value={contextValue}>{children}</TripProvider>;
}
