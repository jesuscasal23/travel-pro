"use client";

import { useEffect, useMemo, useState } from "react";
import { usePostHog } from "posthog-js/react";
import {
  useVisaEnrichment,
  useWeatherEnrichment,
  useAccommodationEnrichment,
  useAuthStatus,
  useTravelerPreferences,
  useTrip,
  useDiscoverActivities,
  useRecordActivitySwipe,
} from "@/hooks/api";
import { useShallow } from "zustand/shallow";
import { useTripStore, storeHydrationPromise } from "@/stores/useTripStore";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { TripProvider, type TripContextValue } from "@/components/trip/TripContext";
import {
  DISCOVERY_TOTAL_CARDS,
  DISCOVERY_TOTAL_BATCHES,
  advanceDiscoveryCursor,
  appendDiscoveryBatch,
  createDiscoveryQueueState,
  getOrderedDiscoveryCards,
} from "@/lib/features/trips/discovery-queue";
import type { DiscoveryStatus, Itinerary } from "@/types";

interface TripClientProviderProps {
  tripId: string;
  children: React.ReactNode;
}

export function TripClientProvider({ tripId, children }: TripClientProviderProps) {
  const {
    itinerary,
    dateStart,
    setDateStart,
    setDateEnd,
    currentTripId,
    setCurrentTripId,
    setItinerary,
    needsRegeneration,
    setNeedsRegeneration,
    travelers,
  } = useTripStore(
    useShallow((s) => ({
      itinerary: s.itinerary,
      dateStart: s.dateStart,
      setDateStart: s.setDateStart,
      setDateEnd: s.setDateEnd,
      currentTripId: s.currentTripId,
      setCurrentTripId: s.setCurrentTripId,
      setItinerary: s.setItinerary,
      needsRegeneration: s.needsRegeneration,
      setNeedsRegeneration: s.setNeedsRegeneration,
      travelers: s.travelers,
    }))
  );

  const route = itinerary?.route ?? [];
  const days = itinerary?.days ?? [];
  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();

  const travelerPreferences = useTravelerPreferences({ includeTransientFallback: true });
  const nationality = travelerPreferences.data?.nationality ?? "";
  const homeAirport = travelerPreferences.data?.homeAirport ?? "";
  const travelStyle = travelerPreferences.data?.travelStyle ?? "smart-budget";
  const interests = travelerPreferences.data?.interests ?? [];
  const transientProfile =
    nationality && homeAirport ? { nationality, homeAirport, travelStyle, interests } : null;
  const requestProfile = travelerPreferences.source === "server" ? undefined : transientProfile;
  const hasDiscoveryProfile = travelerPreferences.source === "server" || requestProfile !== null;

  const [storeReady, setStoreReady] = useState(false);
  useEffect(() => {
    void storeHydrationPromise.then(() => setStoreReady(true));
  }, []);

  const tripQueryEnabled = storeReady && tripId !== "guest";
  const tripQuery = useTrip(tripId, { enabled: tripQueryEnabled });

  useEffect(() => {
    if (!tripQueryEnabled || tripQuery.isPending) return;

    if (tripQuery.data === null) {
      setCurrentTripId("");
      setItinerary(null);
      return;
    }

    const dbItinerary = tripQuery.data?.itineraries?.[0]?.data as Itinerary | undefined;
    if (!dbItinerary) {
      if (useTripStore.getState().currentTripId !== tripId) {
        setCurrentTripId(tripId);
        setItinerary(null);
      }
      return;
    }

    const local = useTripStore.getState().itinerary;
    const localTripId = useTripStore.getState().currentTripId;
    const dbHasActivities = dbItinerary.days?.some(
      (d: { activities?: unknown[] }) => d.activities && d.activities.length > 0
    );
    const localHasActivities = local?.days?.some((d) => d.activities && d.activities.length > 0);
    const shouldSync =
      localTripId !== tripId ||
      !local ||
      local.route.length === 0 ||
      (local.days.length === 0 && dbItinerary.route.length > 0) ||
      (dbHasActivities && !localHasActivities);

    if (shouldSync) {
      setCurrentTripId(tripId);
      setItinerary(dbItinerary);
    }

    if (tripQuery.data?.dateStart && !useTripStore.getState().dateStart) {
      setDateStart(tripQuery.data.dateStart);
    }
    if (tripQuery.data?.dateEnd && !useTripStore.getState().dateEnd) {
      setDateEnd(tripQuery.data.dateEnd);
    }
  }, [
    tripId,
    tripQuery.data,
    tripQuery.isPending,
    tripQueryEnabled,
    setCurrentTripId,
    setItinerary,
    setDateStart,
    setDateEnd,
  ]);

  const tripServerItinerary = tripQuery.data?.itineraries?.[0]?.data as Itinerary | undefined;
  const tripServerDiscoveryStatus = (tripQuery.data?.itineraries?.[0]?.discoveryStatus ??
    "completed") as DiscoveryStatus;
  const tripSyncPending = tripId !== "guest" && tripQueryEnabled && tripQuery.isPending;
  const tripHydrationPending =
    tripId !== "guest" && Boolean(tripServerItinerary) && (currentTripId !== tripId || !itinerary);
  const tripUnavailable =
    tripId !== "guest" && tripQueryEnabled && tripQuery.isSuccess && tripQuery.data === null;
  const tripLoadFailedWithoutLocal =
    tripId !== "guest" && tripQuery.isError && (!itinerary || currentTripId !== tripId);

  const discoverActivitiesMutation = useDiscoverActivities();
  const recordActivitySwipeMutation = useRecordActivitySwipe();
  const [queueState, setQueueState] = useState(createDiscoveryQueueState);
  const [nextBatchIndex, setNextBatchIndex] = useState(0);
  const [discoveryBatchesDone, setDiscoveryBatchesDone] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveryStatusOverride, setDiscoveryStatusOverride] = useState<DiscoveryStatus | null>(
    null
  );

  const discoveryCards = useMemo(() => getOrderedDiscoveryCards(queueState), [queueState]);
  const discoveryStatus = discoveryStatusOverride ?? tripServerDiscoveryStatus;
  const discoveryCity = itinerary?.route?.[0];
  const discoveryBatchLoading = discoverActivitiesMutation.isPending;
  const shouldRunDiscovery =
    tripId !== "guest" &&
    !!itinerary &&
    itinerary.days.length === 0 &&
    itinerary.route.length > 0 &&
    (discoveryStatus === "pending" || discoveryStatus === "in_progress");

  useEffect(() => {
    if (
      !shouldRunDiscovery ||
      discoveryBatchesDone ||
      discoveryBatchLoading ||
      nextBatchIndex >= DISCOVERY_TOTAL_BATCHES ||
      !discoveryCity ||
      !hasDiscoveryProfile
    ) {
      return;
    }

    let cancelled = false;

    discoverActivitiesMutation
      .mutateAsync({
        tripId,
        cityId: discoveryCity.id,
        batchIndex: nextBatchIndex,
        profile: requestProfile ?? undefined,
      })
      .then((activities) => {
        if (cancelled) return;
        setDiscoveryError(null);
        setDiscoveryStatusOverride("in_progress");
        setQueueState((prev) => appendDiscoveryBatch(prev, nextBatchIndex, activities));
        const next = nextBatchIndex + 1;
        setNextBatchIndex(next);
        if (next >= DISCOVERY_TOTAL_BATCHES) {
          setDiscoveryBatchesDone(true);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setDiscoveryError(
          error instanceof Error ? error.message : "Could not load activity recommendations"
        );
        setDiscoveryBatchesDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [
    shouldRunDiscovery,
    discoveryBatchesDone,
    discoveryBatchLoading,
    nextBatchIndex,
    discoveryCity,
    hasDiscoveryProfile,
    discoverActivitiesMutation,
    tripId,
    requestProfile,
  ]);

  const handleDiscoverySwipe = (decision: "liked" | "disliked") => {
    const card = discoveryCards[queueState.cursor];
    if (!card || !discoveryCity) return;

    const nextCursor = queueState.cursor + 1;
    const isFinalSwipe =
      nextCursor >= DISCOVERY_TOTAL_CARDS ||
      (discoveryBatchesDone && nextCursor >= discoveryCards.length);

    setQueueState((prev) => advanceDiscoveryCursor(prev));
    if (isFinalSwipe) {
      setDiscoveryStatusOverride("completed");
    }

    recordActivitySwipeMutation.mutate({
      tripId,
      destination: discoveryCity.city,
      activity: card,
      decision,
      isFinal: isFinalSwipe,
    });
  };

  const shouldEnrich = !!(
    itinerary &&
    itinerary.days.length > 0 &&
    itinerary.route.length > 0 &&
    !(itinerary.visaData?.length && itinerary.weatherData?.length)
  );

  const hasAccommodationWithHotels = itinerary?.accommodationData?.some((a) => a.hotels.length > 0);
  const shouldEnrichAccommodation = !!(
    itinerary &&
    itinerary.days.length > 0 &&
    itinerary.route.length > 0 &&
    !hasAccommodationWithHotels
  );

  const {
    data: visaData,
    isLoading: visaLoading,
    error: visaError,
  } = useVisaEnrichment(nationality, itinerary?.route ?? [], shouldEnrich);
  const {
    data: weatherData,
    isLoading: weatherLoading,
    error: weatherError,
  } = useWeatherEnrichment(itinerary?.route ?? [], dateStart, shouldEnrich);
  const {
    data: accommodationData,
    isLoading: accommodationLoading,
    error: accommodationError,
  } = useAccommodationEnrichment(
    itinerary?.route ?? [],
    dateStart,
    travelers || 1,
    travelStyle || "smart-budget",
    shouldEnrichAccommodation
  );

  useEffect(() => {
    if (!visaData && !weatherData && !accommodationData) return;
    const current = useTripStore.getState().itinerary;
    if (!current || current.days.length === 0) return;
    const needsVisa = visaData && !current.visaData?.length;
    const needsWeather = weatherData && !current.weatherData?.length;
    // Only sync accommodation when there are actual hotel results — an empty-hotels
    // response (e.g. SerpApi unavailable) must not trigger repeated setItinerary calls.
    const needsAccommodation =
      accommodationData?.some((a) => a.hotels.length > 0) &&
      !current.accommodationData?.some((a) => a.hotels.length > 0);
    if (!needsVisa && !needsWeather && !needsAccommodation) return;
    setItinerary({
      ...current,
      ...(needsVisa ? { visaData } : {}),
      ...(needsWeather ? { weatherData } : {}),
      ...(needsAccommodation ? { accommodationData } : {}),
    });
  }, [visaData, weatherData, accommodationData, setItinerary]);

  useEffect(() => {
    posthog?.capture("itinerary_viewed", { trip_id: tripId, city_count: route.length });
  }, [posthog, tripId, route.length]);

  if (!storeReady || tripSyncPending || tripHydrationPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[image:var(--gradient-page-trip)]">
        <div className="border-brand-primary h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent" />
      </div>
    );
  }

  if (tripUnavailable || tripLoadFailedWithoutLocal) {
    return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
  }

  if (!itinerary) {
    return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
  }

  const countries = [...new Set(route.map((r) => r.country))];
  const singleCity = route.length === 1;
  const tripTitle = singleCity ? `${route[0].city}, ${route[0].country}` : countries.join(", ");
  const totalDays = days.length || route.reduce((sum, r) => sum + r.days, 0);

  const contextValue: TripContextValue = {
    itinerary,
    tripId,
    tripTitle,
    totalDays,
    countries,
    isAuthenticated,
    isPartialItinerary: false,
    isGenerating: false,
    generationError: null,
    needsRegeneration,
    onRetry: () => undefined,
    onRegenerate: () => setNeedsRegeneration(false),
    onDismissRegeneration: () => setNeedsRegeneration(false),
    visaLoading: visaLoading && shouldEnrich,
    weatherLoading: weatherLoading && shouldEnrich,
    visaError: !!visaError,
    weatherError: !!weatherError,
    accommodationLoading: accommodationLoading && shouldEnrichAccommodation,
    accommodationError: !!accommodationError,
    discoveryStatus,
    discoveryCards,
    discoveryCursor: queueState.cursor,
    discoveryTotalTarget: DISCOVERY_TOTAL_CARDS,
    discoveryIsLoading:
      shouldRunDiscovery &&
      (discoveryBatchLoading ||
        (discoveryCards.length === 0 && !discoveryError && !discoveryBatchesDone)),
    discoveryHasPendingBatches: shouldRunDiscovery && !discoveryBatchesDone,
    discoveryError,
    onDiscoverySwipe: handleDiscoverySwipe,
  };

  return <TripProvider value={contextValue}>{children}</TripProvider>;
}
