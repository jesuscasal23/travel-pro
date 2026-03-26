"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useTripStore } from "@/stores/useTripStore";
import { usePlanFormStore } from "@/stores/usePlanFormStore";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { TripProvider, type TripContextValue } from "@/components/trip/TripContext";
import {
  DISCOVERY_TOTAL_CARDS,
  advanceDiscoveryCursor,
  setDiscoveryCards,
  createDiscoveryQueueState,
} from "@/lib/features/trips/discovery-queue";
import type { CityAccommodation, DiscoveryStatus, Itinerary } from "@/types";

interface TripClientProviderProps {
  tripId: string;
  children: React.ReactNode;
}

export function TripClientProvider({ tripId, children }: TripClientProviderProps) {
  const { needsRegeneration, setNeedsRegeneration } = useTripStore(
    useShallow((s) => ({
      needsRegeneration: s.needsRegeneration,
      setNeedsRegeneration: s.setNeedsRegeneration,
    }))
  );

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

  // Trip data from React Query — the single source of truth for trip identity/dates
  const tripQueryEnabled = tripId !== "guest";
  const tripQuery = useTrip(tripId, { enabled: tripQueryEnabled });
  const tripData = tripQuery.data;

  // For guests, fall back to the plan form store for dates/travelers
  const planFormDateStart = usePlanFormStore((s) => s.dateStart);
  const planFormTravelers = usePlanFormStore((s) => s.travelers);
  const dateStart = tripData?.dateStart ?? planFormDateStart;
  const travelers = tripData?.travelers ?? planFormTravelers;

  // ── Local itinerary state ────────────────────────────────────────────────────
  // The itinerary lives here, not in Zustand. It starts as the DB value and is
  // enriched in-place as visa/weather/accommodation data arrives.

  const [localItinerary, setLocalItinerary] = useState<Itinerary | null>(null);
  // Track which tripId the local state belongs to so we re-sync on navigation
  const localTripIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tripQueryEnabled || tripQuery.isPending) return;

    if (tripQuery.data === null) {
      localTripIdRef.current = null;
      setLocalItinerary(null);
      return;
    }

    const dbItinerary = tripQuery.data?.itineraries?.[0]?.data as Itinerary | undefined;
    if (!dbItinerary) {
      if (localTripIdRef.current !== tripId) {
        localTripIdRef.current = tripId;
        setLocalItinerary(null);
      }
      return;
    }

    const dbHasActivities = dbItinerary.days?.some(
      (d: { activities?: unknown[] }) => d.activities && d.activities.length > 0
    );

    setLocalItinerary((prev) => {
      const localHasActivities = prev?.days?.some((d) => d.activities && d.activities.length > 0);
      const shouldSync =
        localTripIdRef.current !== tripId ||
        !prev ||
        prev.route.length === 0 ||
        (prev.days.length === 0 && dbItinerary.route.length > 0) ||
        (dbHasActivities && !localHasActivities);

      if (shouldSync) {
        localTripIdRef.current = tripId;
        return dbItinerary;
      }
      return prev;
    });
  }, [tripId, tripQuery.data, tripQuery.isPending, tripQueryEnabled]);

  // ── Loading / error states ───────────────────────────────────────────────────

  const tripServerItinerary = tripQuery.data?.itineraries?.[0]?.data as Itinerary | undefined;
  const tripServerDiscoveryStatus = (tripQuery.data?.itineraries?.[0]?.discoveryStatus ??
    "completed") as DiscoveryStatus;
  const tripSyncPending = tripId !== "guest" && tripQueryEnabled && tripQuery.isPending;
  const tripHydrationPending =
    tripId !== "guest" && Boolean(tripServerItinerary) && !localItinerary;
  const tripUnavailable =
    tripId !== "guest" && tripQueryEnabled && tripQuery.isSuccess && tripQuery.data === null;
  const tripLoadFailedWithoutLocal = tripId !== "guest" && tripQuery.isError && !localItinerary;

  // ── Activity discovery ───────────────────────────────────────────────────────

  const discoverActivitiesMutation = useDiscoverActivities();
  const recordActivitySwipeMutation = useRecordActivitySwipe();
  const [queueState, setQueueState] = useState(createDiscoveryQueueState);
  const [discoveryDone, setDiscoveryDone] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveryStatusOverride, setDiscoveryStatusOverride] = useState<DiscoveryStatus | null>(
    null
  );

  const discoveryCards = queueState.cards;
  const discoveryStatus = discoveryStatusOverride ?? tripServerDiscoveryStatus;
  const discoveryCity = localItinerary?.route?.[0];
  const shouldRunDiscovery =
    tripId !== "guest" &&
    !!localItinerary &&
    localItinerary.days.length === 0 &&
    localItinerary.route.length > 0 &&
    (discoveryStatus === "pending" || discoveryStatus === "in_progress");

  useEffect(() => {
    if (
      !shouldRunDiscovery ||
      discoveryDone ||
      discoverActivitiesMutation.isPending ||
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
        profile: requestProfile ?? undefined,
      })
      .then((activities) => {
        if (cancelled) return;
        setDiscoveryError(null);
        setDiscoveryStatusOverride("in_progress");
        setQueueState((prev) => setDiscoveryCards(prev, activities));
        setDiscoveryDone(true);
      })
      .catch((error) => {
        if (cancelled) return;
        setDiscoveryError(
          error instanceof Error ? error.message : "Could not load activity recommendations"
        );
        setDiscoveryDone(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutation excluded to prevent re-trigger loop (see commit b63f7fa)
  }, [
    shouldRunDiscovery,
    discoveryDone,
    discoveryCity,
    hasDiscoveryProfile,
    tripId,
    requestProfile,
  ]);

  const handleDiscoverySwipe = (decision: "liked" | "disliked") => {
    const card = discoveryCards[queueState.cursor];
    if (!card || !discoveryCity) return;

    const nextCursor = queueState.cursor + 1;
    const isFinalSwipe = nextCursor >= DISCOVERY_TOTAL_CARDS || nextCursor >= discoveryCards.length;

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

  // ── Enrichment ───────────────────────────────────────────────────────────────

  const route = localItinerary?.route ?? [];

  const shouldEnrich = !!(
    localItinerary &&
    localItinerary.days.length > 0 &&
    localItinerary.route.length > 0 &&
    !(localItinerary.visaData?.length && localItinerary.weatherData?.length)
  );

  const hasAccommodationWithHotels = localItinerary?.accommodationData?.some(
    (a) => a.hotels.length > 0
  );
  const shouldEnrichAccommodation = !!(
    localItinerary &&
    localItinerary.days.length > 0 &&
    localItinerary.route.length > 0 &&
    !hasAccommodationWithHotels
  );

  const {
    data: visaData,
    isLoading: visaLoading,
    error: visaError,
  } = useVisaEnrichment(nationality, route, shouldEnrich);
  const {
    data: weatherData,
    isLoading: weatherLoading,
    error: weatherError,
  } = useWeatherEnrichment(route, dateStart, shouldEnrich);
  const {
    data: accommodationData,
    isLoading: accommodationLoading,
    error: accommodationError,
  } = useAccommodationEnrichment(
    route,
    dateStart,
    travelers,
    travelStyle || "smart-budget",
    shouldEnrichAccommodation
  );

  // Merge enrichment results into local itinerary state
  useEffect(() => {
    if (!visaData && !weatherData && !accommodationData) return;
    setLocalItinerary((prev) => {
      if (!prev || prev.days.length === 0) return prev;
      const needsVisa = visaData && !prev.visaData?.length;
      const needsWeather = weatherData && !prev.weatherData?.length;
      const needsAccommodation =
        accommodationData?.some((a) => a.hotels.length > 0) &&
        !prev.accommodationData?.some((a) => a.hotels.length > 0);
      if (!needsVisa && !needsWeather && !needsAccommodation) return prev;
      return {
        ...prev,
        ...(needsVisa ? { visaData } : {}),
        ...(needsWeather ? { weatherData } : {}),
        ...(needsAccommodation ? { accommodationData } : {}),
      };
    });
  }, [visaData, weatherData, accommodationData]);

  // Callback for AccommodationTab's manual refetch — updates local state directly
  const handleAccommodationLoaded = useCallback((data: CityAccommodation[]) => {
    setLocalItinerary((prev) => (prev ? { ...prev, accommodationData: data } : prev));
  }, []);

  useEffect(() => {
    posthog?.capture("itinerary_viewed", { trip_id: tripId, city_count: route.length });
  }, [posthog, tripId, route.length]);

  // ── Render guards ────────────────────────────────────────────────────────────

  if (tripSyncPending || tripHydrationPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[image:var(--gradient-page-trip)]">
        <div className="border-brand-primary h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent" />
      </div>
    );
  }

  if (tripUnavailable || tripLoadFailedWithoutLocal) {
    return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
  }

  if (!localItinerary) {
    return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
  }

  const countries = [...new Set(route.map((r) => r.country))];
  const singleCity = route.length === 1;
  const tripTitle = singleCity ? `${route[0].city}, ${route[0].country}` : countries.join(", ");
  const totalDays = localItinerary.days.length || route.reduce((sum, r) => sum + r.days, 0);

  const contextValue: TripContextValue = {
    itinerary: localItinerary,
    tripId,
    tripTitle,
    totalDays,
    countries,
    isAuthenticated,
    dateStart,
    travelers,
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
    onAccommodationLoaded: handleAccommodationLoaded,
    discoveryStatus,
    discoveryCards,
    discoveryCursor: queueState.cursor,
    discoveryTotalTarget: DISCOVERY_TOTAL_CARDS,
    discoveryIsLoading:
      shouldRunDiscovery &&
      (discoverActivitiesMutation.isPending ||
        (discoveryCards.length === 0 && !discoveryError && !discoveryDone)),
    discoveryError,
    onDiscoverySwipe: handleDiscoverySwipe,
  };

  return <TripProvider value={contextValue}>{children}</TripProvider>;
}
