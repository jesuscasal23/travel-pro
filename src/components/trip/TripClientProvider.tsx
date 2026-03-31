"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  useActivityImages,
} from "@/hooks/api";
import { useShallow } from "zustand/shallow";
import { useTripStore } from "@/stores/useTripStore";
import { usePlanFormStore } from "@/stores/usePlanFormStore";
import { daysBetween } from "@/lib/utils/format/date";
import { ApiError } from "@/lib/client/api-fetch";
import { TripErrorState } from "@/components/trip/TripErrorState";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { TripProvider, type TripContextValue } from "@/components/trip/TripContext";
import {
  advanceDiscoveryCursor,
  initDiscoveryQueue,
  createDiscoveryQueueState,
  isPreviouslyCompletedDiscoveryBatch,
} from "@/lib/features/trips/discovery-queue";
import type {
  AssignedActivity,
  CityAccommodation,
  CityStop,
  DiscoveryStatus,
  Itinerary,
} from "@/types";

interface TripClientProviderProps {
  tripId: string;
  children: React.ReactNode;
}

/**
 * Get discoverable cities — cities with at least 1 non-travel day, in route order.
 * Mirrors the server-side logic in activity-swipe-service.ts.
 */
function getDiscoverableCities(route: CityStop[]): CityStop[] {
  return route.filter((city, idx) => {
    const isLast = idx === route.length - 1;
    const nonTravelDays = isLast ? city.days : Math.max(0, city.days - 1);
    return nonTravelDays > 0;
  });
}

export function TripClientProvider({ tripId, children }: TripClientProviderProps) {
  const { needsRebuild, setNeedsRebuild } = useTripStore(
    useShallow((s) => ({
      needsRebuild: s.needsRebuild,
      setNeedsRebuild: s.setNeedsRebuild,
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
  const planFormDateEnd = usePlanFormStore((s) => s.dateEnd);
  const planFormTravelers = usePlanFormStore((s) => s.travelers);
  const planFormTripDirection = usePlanFormStore((s) => s.tripDirection);
  const dateStart = tripData?.dateStart ?? planFormDateStart;
  const dateEnd = tripData?.dateEnd ?? planFormDateEnd;
  const travelers = tripData?.travelers ?? planFormTravelers;
  const tripDirection =
    ((tripData as unknown as Record<string, unknown>)?.tripDirection as string) ??
    planFormTripDirection;

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

  const tripServerDiscoveryStatus = (tripQuery.data?.itineraries?.[0]?.discoveryStatus ??
    "completed") as DiscoveryStatus;
  const tripSyncPending = tripId !== "guest" && tripQueryEnabled && tripQuery.isPending;
  const tripUnavailable =
    tripId !== "guest" && tripQueryEnabled && tripQuery.isSuccess && tripQuery.data === null;
  const tripLoadFailedWithoutLocal = tripId !== "guest" && tripQuery.isError && !localItinerary;
  const tripQueryStatus = tripQuery.error instanceof ApiError ? tripQuery.error.status : null;

  // ── Assigned activities from server ──────────────────────────────────────────
  const serverAssignedActivities: AssignedActivity[] =
    (tripData as { assignedActivities?: AssignedActivity[] })?.assignedActivities ?? [];

  // ── Activity discovery (multi-city) ──────────────────────────────────────────

  const discoverActivitiesMutation = useDiscoverActivities();
  const recordActivitySwipeMutation = useRecordActivitySwipe();
  const [queueState, setQueueState] = useState(createDiscoveryQueueState);
  const [discoveryDone, setDiscoveryDone] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveryStatusOverride, setDiscoveryStatusOverride] = useState<DiscoveryStatus | null>(
    null
  );

  // Multi-city state
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [requiredCount, setRequiredCount] = useState(0);
  const [roundLimitReached, setRoundLimitReached] = useState(false);

  const discoveryCards = queueState.cards;
  const discoveryStatus = discoveryStatusOverride ?? tripServerDiscoveryStatus;
  const discoverableCities = useMemo(
    () => getDiscoverableCities(localItinerary?.route ?? []),
    [localItinerary?.route]
  );
  const currentDiscoveryCity = discoverableCities[currentCityIndex] ?? null;

  const shouldRunDiscovery =
    tripId !== "guest" &&
    !!localItinerary &&
    localItinerary.route.length > 0 &&
    (discoveryStatus === "pending" || discoveryStatus === "in_progress");

  // Trigger discovery for the current city
  useEffect(() => {
    if (
      !shouldRunDiscovery ||
      discoveryDone ||
      discoverActivitiesMutation.isPending ||
      !currentDiscoveryCity ||
      !hasDiscoveryProfile
    ) {
      return;
    }

    let cancelled = false;

    discoverActivitiesMutation
      .mutateAsync({
        tripId,
        cityId: currentDiscoveryCity.id,
        profile: requestProfile ?? undefined,
      })
      .then((result) => {
        if (cancelled) return;
        setDiscoveryError(null);
        if (result.roundLimitReached) setRoundLimitReached(true);
        const queue = initDiscoveryQueue(result.activities, currentDiscoveryCity.id);

        if (queue.cards.length > 0) {
          setDiscoveryStatusOverride("in_progress");
          setQueueState(queue);
          setDiscoveryDone(true);
          return;
        }

        setQueueState(queue);
        setDiscoveryDone(true);

        if (result.roundLimitReached) {
          setDiscoveryStatusOverride("in_progress");
          return;
        }

        if (!isPreviouslyCompletedDiscoveryBatch(result.activities, queue)) {
          setDiscoveryError("We couldn't load activity cards for this city. Please try again.");
          return;
        }

        // The batch only contained already-decided activities, so continue.
        if (currentCityIndex < discoverableCities.length - 1) {
          setCurrentCityIndex((i) => i + 1);
        } else {
          setDiscoveryStatusOverride("completed");
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutation excluded to prevent re-trigger loop
  }, [
    shouldRunDiscovery,
    discoveryDone,
    currentDiscoveryCity?.id,
    hasDiscoveryProfile,
    tripId,
    requestProfile,
    currentCityIndex,
  ]);

  // ── Activity image prefetch (5-card buffer) ─────────────────────────────
  const activityImageMap = useActivityImages(tripId, discoveryCards, queueState.cursor);
  const discoveryCardsWithImages = useMemo(
    () =>
      discoveryCards.map((card) => {
        const resolved = activityImageMap.get(card.id);
        if (resolved && resolved !== card.imageUrl) {
          return { ...card, imageUrl: resolved };
        }
        return card;
      }),
    [discoveryCards, activityImageMap]
  );

  const handleDiscoverySwipe = (decision: "liked" | "disliked") => {
    const card = discoveryCards[queueState.cursor];
    if (!card || !currentDiscoveryCity) return;

    setQueueState((prev) => advanceDiscoveryCursor(prev));

    recordActivitySwipeMutation.mutate(
      {
        tripId,
        activityId: card.id,
        decision,
        cityId: currentDiscoveryCity.id,
      },
      {
        onSuccess: (data) => {
          // Update progress from server response
          setLikedCount(data.cityProgress.likedCount);
          setRequiredCount(data.cityProgress.requiredCount);

          if (data.allCitiesComplete) {
            setDiscoveryStatusOverride("completed");
            return;
          }

          if (data.cityProgress.cityComplete && data.nextCityId) {
            // Advance to next city
            const nextIdx = discoverableCities.findIndex((c) => c.id === data.nextCityId);
            if (nextIdx !== -1) {
              setCurrentCityIndex(nextIdx);
              setDiscoveryDone(false);
              setLikedCount(0);
              setRequiredCount(0);
              setRoundLimitReached(false);
            }
          } else if (data.batchComplete && !data.cityProgress.cityComplete) {
            if (roundLimitReached) {
              // Cap reached — no more batches for this city
              return;
            }
            // Need more cards for this city — generate another batch
            const allNames = discoveryCards.map((c) => c.name);
            setDiscoveryDone(false);
            discoverActivitiesMutation
              .mutateAsync({
                tripId,
                cityId: currentDiscoveryCity.id,
                profile: requestProfile ?? undefined,
                excludeNames: allNames,
              })
              .then((result) => {
                if (result.roundLimitReached) setRoundLimitReached(true);
                const queue = initDiscoveryQueue(result.activities, currentDiscoveryCity.id);
                setQueueState(queue);
                setDiscoveryDone(true);
              })
              .catch((error) => {
                setDiscoveryError(
                  error instanceof Error ? error.message : "Could not load more activities"
                );
                setDiscoveryDone(true);
              });
          }
        },
      }
    );
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
    if (route.length > 0) {
      posthog?.capture("itinerary_viewed", { trip_id: tripId, city_count: route.length });
    }
  }, [posthog, tripId, route.length]);

  // ── Render guards ────────────────────────────────────────────────────────────

  if (tripSyncPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[image:var(--gradient-page-trip)]">
        <div className="border-brand-primary h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent" />
      </div>
    );
  }

  if (tripUnavailable || tripLoadFailedWithoutLocal) {
    console.warn("[TripClientProvider] Trip load blocked", {
      tripId,
      reason: tripUnavailable ? "api_returned_null" : "query_error_no_local",
      status: tripQueryStatus,
      queryStatus: tripQuery.status,
      queryError: tripQuery.error?.message,
      hasLocalItinerary: !!localItinerary,
      isAuthenticated,
    });
    if (tripUnavailable) {
      return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
    }

    if (tripQueryStatus === 429) {
      return (
        <TripErrorState
          isAuthenticated={isAuthenticated ?? false}
          title="Too many requests"
          description="You have been temporarily rate limited while loading this trip. Wait a moment, then try again."
          onRetry={() => void tripQuery.refetch()}
        />
      );
    }

    if (tripQueryStatus === 403) {
      return (
        <TripErrorState
          isAuthenticated={isAuthenticated ?? false}
          title="You do not have access to this trip"
          description="This trip is not available for your account right now."
          ctaLabel="Reload trip"
          onRetry={() => void tripQuery.refetch()}
        />
      );
    }

    return (
      <TripErrorState
        isAuthenticated={isAuthenticated ?? false}
        title="We could not load this trip"
        description="This looks temporary. Try again in a moment."
        onRetry={() => void tripQuery.refetch()}
      />
    );
  }

  const countries = [...new Set(route.map((r) => r.country))];
  const singleCity = route.length === 1;
  const tripTitle = singleCity
    ? `${route[0].city}, ${route[0].country}`
    : countries.length > 0
      ? countries.join(", ")
      : (tripData?.destination ?? "Untitled Trip");
  const totalDays =
    localItinerary?.days.length ||
    route.reduce((sum, r) => sum + r.days, 0) ||
    daysBetween(dateStart, dateEnd);

  const contextValue: TripContextValue = {
    itinerary: localItinerary ?? null,
    tripId,
    tripTitle,
    totalDays,
    countries,
    isAuthenticated,
    dateStart,
    dateEnd,
    travelers,
    tripDirection: tripDirection ?? "return",
    isPartialItinerary: false,
    isBuilding: false,
    buildError: null,
    needsRebuild,
    onRetry: () => undefined,
    onRebuild: () => setNeedsRebuild(false),
    onDismissRebuild: () => setNeedsRebuild(false),
    visaLoading: visaLoading && shouldEnrich,
    weatherLoading: weatherLoading && shouldEnrich,
    visaError: !!visaError,
    weatherError: !!weatherError,
    accommodationLoading: accommodationLoading && shouldEnrichAccommodation,
    accommodationError: !!accommodationError,
    onAccommodationLoaded: handleAccommodationLoaded,
    discoveryStatus,
    discoveryCards: discoveryCardsWithImages,
    discoveryCursor: queueState.cursor,
    discoveryTotalTarget: discoveryCards.length,
    discoveryIsLoading:
      shouldRunDiscovery &&
      (discoverActivitiesMutation.isPending ||
        (discoveryCards.length === 0 && !discoveryError && !discoveryDone)),
    discoveryError,
    onDiscoverySwipe: handleDiscoverySwipe,
    discoveryCityIndex: currentCityIndex,
    discoveryTotalCities: discoverableCities.length,
    discoveryLikedCount: likedCount,
    discoveryRequiredCount: requiredCount,
    discoveryRoundLimitReached: roundLimitReached,
    assignedActivities: serverAssignedActivities,
  };

  return <TripProvider value={contextValue}>{children}</TripProvider>;
}
