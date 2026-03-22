"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import {
  useTripGeneration,
  useCityActivityGeneration,
  useVisaEnrichment,
  useWeatherEnrichment,
  useAccommodationEnrichment,
  useAuthStatus,
  useTrip,
} from "@/hooks/api";
import { useTripStore, storeHydrationPromise } from "@/stores/useTripStore";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { TripProvider, type TripContextValue } from "@/components/trip/TripContext";
import type { Itinerary } from "@/types";

interface TripClientProviderProps {
  tripId: string;
  children: React.ReactNode;
}

export function TripClientProvider({ tripId, children }: TripClientProviderProps) {
  const itinerary = useTripStore((s) => s.itinerary);
  const route = itinerary?.route ?? [];
  const days = itinerary?.days ?? [];
  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();

  const nationality = useTripStore((s) => s.nationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const travelStyle = useTripStore((s) => s.travelStyle);
  const interests = useTripStore((s) => s.interests);
  const dateStart = useTripStore((s) => s.dateStart);
  const setDateStart = useTripStore((s) => s.setDateStart);
  const setDateEnd = useTripStore((s) => s.setDateEnd);
  const currentTripId = useTripStore((s) => s.currentTripId);
  const setCurrentTripId = useTripStore((s) => s.setCurrentTripId);
  const setItinerary = useTripStore((s) => s.setItinerary);
  const needsRegeneration = useTripStore((s) => s.needsRegeneration);
  const setNeedsRegeneration = useTripStore((s) => s.setNeedsRegeneration);
  const travelers = useTripStore((s) => s.travelers);

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

    // Sync trip-level dates so enrichment hooks (accommodation, weather) can use them
    const trip = tripQuery.data;
    if (trip?.dateStart && !useTripStore.getState().dateStart) {
      setDateStart(trip.dateStart);
    }
    if (trip?.dateEnd && !useTripStore.getState().dateEnd) {
      setDateEnd(trip.dateEnd);
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
  const tripSyncPending = tripId !== "guest" && tripQueryEnabled && tripQuery.isPending;
  const tripHydrationPending =
    tripId !== "guest" && Boolean(tripServerItinerary) && (currentTripId !== tripId || !itinerary);
  const tripUnavailable =
    tripId !== "guest" && tripQueryEnabled && tripQuery.isSuccess && tripQuery.data === null;
  const tripLoadFailedWithoutLocal =
    tripId !== "guest" && tripQuery.isError && (!itinerary || currentTripId !== tripId);

  const isPartialItinerary = !!(itinerary && itinerary.days.length === 0 && tripId !== "guest");
  const generateMutation = useTripGeneration();
  const genFiredRef = useRef(false);
  const genAttemptsRef = useRef(0);

  useEffect(() => {
    if (!isPartialItinerary || tripSyncPending || genFiredRef.current || !itinerary) return;
    if (genAttemptsRef.current >= 2) return; // Max 2 auto-retries
    genFiredRef.current = true;
    genAttemptsRef.current += 1;

    const profile = { nationality, homeAirport, travelStyle, interests };
    const cities =
      itinerary.route.length > 0
        ? itinerary.route.map((r) => ({
            id: r.id,
            city: r.city,
            country: r.country,
            countryCode: r.countryCode,
            iataCode: r.iataCode ?? "",
            lat: r.lat,
            lng: r.lng,
            minDays: r.days,
            maxDays: r.days,
          }))
        : undefined;

    generateMutation.mutate(
      { tripId, profile, promptVersion: "v1", cities },
      {
        onSuccess: (result) => {
          if (result) setItinerary(result);
        },
        onError: () => {
          genFiredRef.current = false;
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartialItinerary, tripSyncPending, tripId]);

  const cityActivityMutation = useCityActivityGeneration();
  const [generatingCityId, setGeneratingCityId] = useState<string | null>(null);
  const [cityActivityErrors, setCityActivityErrors] = useState<Record<string, string>>({});
  const cityGenFiredRef = useRef<Set<string>>(new Set());

  // Auto-trigger activity generation for cities missing activities
  useEffect(() => {
    if (!itinerary || itinerary.days.length === 0 || itinerary.route.length === 0) return;
    if (generatingCityId) return; // One at a time

    const cityMissingActivities = itinerary.route.find((stop) => {
      if (cityGenFiredRef.current.has(stop.id)) return false;
      if (cityActivityErrors[stop.id]) return false;
      const hasActs = itinerary.days.some((d) => d.city === stop.city && d.activities.length > 0);
      return !hasActs;
    });

    if (cityMissingActivities) {
      cityGenFiredRef.current.add(cityMissingActivities.id);
      // Defer to avoid calling setState during render
      queueMicrotask(() => {
        handleGenerateActivities(cityMissingActivities.id, cityMissingActivities.city);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary, generatingCityId, cityActivityErrors]);

  const handleGenerateActivities = (cityId: string, cityName: string) => {
    setGeneratingCityId(cityId);
    setCityActivityErrors((prev) => {
      const next = { ...prev };
      delete next[cityId];
      return next;
    });
    const profile = { nationality, homeAirport, travelStyle, interests };
    cityActivityMutation.mutate(
      { tripId, cityId, cityName, profile },
      {
        onSuccess: (mergedItinerary) => {
          setItinerary(mergedItinerary);
        },
        onError: (error) => {
          setCityActivityErrors((prev) => ({
            ...prev,
            [cityId]: error instanceof Error ? error.message : "Activity generation failed",
          }));
        },
        onSettled: () => setGeneratingCityId(null),
      }
    );
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
    const needsAccommodation =
      accommodationData && !current.accommodationData?.some((a) => a.hotels.length > 0);
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
  const generationError = generateMutation.error?.message ?? null;
  const isGenerating = isPartialItinerary && !generationError;

  const handleRegenerate = () => {
    setNeedsRegeneration(false);
    genFiredRef.current = false;
    generateMutation.reset();
    setItinerary({
      ...itinerary,
      days: [],
      visaData: undefined,
      weatherData: undefined,
      accommodationData: undefined,
    });
  };

  const handleRetry = () => {
    genFiredRef.current = false;
    generateMutation.reset();

    const profile = { nationality, homeAirport, travelStyle, interests };
    const cities =
      itinerary.route.length > 0
        ? itinerary.route.map((r) => ({
            id: r.id,
            city: r.city,
            country: r.country,
            countryCode: r.countryCode,
            iataCode: r.iataCode ?? "",
            lat: r.lat,
            lng: r.lng,
            minDays: r.days,
            maxDays: r.days,
          }))
        : undefined;

    generateMutation.mutate(
      { tripId, profile, promptVersion: "v1", cities },
      {
        onSuccess: (result) => {
          if (result) setItinerary(result);
        },
        onError: () => {
          genFiredRef.current = false;
        },
      }
    );
  };

  const contextValue: TripContextValue = {
    itinerary,
    tripId,
    tripTitle,
    totalDays,
    countries,
    isAuthenticated,
    isPartialItinerary,
    isGenerating,
    generationError,
    needsRegeneration,
    onRetry: handleRetry,
    onRegenerate: handleRegenerate,
    onDismissRegeneration: () => setNeedsRegeneration(false),
    visaLoading: visaLoading && shouldEnrich,
    weatherLoading: weatherLoading && shouldEnrich,
    visaError: !!visaError,
    weatherError: !!weatherError,
    accommodationLoading: accommodationLoading && shouldEnrichAccommodation,
    accommodationError: !!accommodationError,
    generatingCityId,
    cityActivityErrors,
    onGenerateActivities: handleGenerateActivities,
  };

  return <TripProvider value={contextValue}>{children}</TripProvider>;
}
