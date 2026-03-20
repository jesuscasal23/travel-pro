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
} from "@/hooks/api";
import { useTripStore, storeHydrationPromise } from "@/stores/useTripStore";
import { useItinerary } from "@/hooks/useItinerary";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { TripProvider, type TripContextValue } from "@/components/trip/TripContext";
import type { Itinerary } from "@/types";

interface TripClientProviderProps {
  tripId: string;
  children: React.ReactNode;
}

export function TripClientProvider({ tripId, children }: TripClientProviderProps) {
  const itinerary = useItinerary();
  const route = itinerary?.route ?? [];
  const days = itinerary?.days ?? [];
  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();

  const nationality = useTripStore((s) => s.nationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const travelStyle = useTripStore((s) => s.travelStyle);
  const interests = useTripStore((s) => s.interests);
  const dateStart = useTripStore((s) => s.dateStart);
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

  const [dbSyncDone, setDbSyncDone] = useState(tripId === "guest");
  const syncFiredRef = useRef(false);
  useEffect(() => {
    if (tripId === "guest" || syncFiredRef.current) return;
    syncFiredRef.current = true;

    fetch(`/api/v1/trips/${tripId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.trip?.itineraries?.[0]?.data) return;
        const dbItinerary = data.trip.itineraries[0].data as Itinerary;
        const local = useTripStore.getState().itinerary;
        const localTripId = useTripStore.getState().currentTripId;
        const dbHasActivities = dbItinerary.days?.some(
          (d: { activities?: unknown[] }) => d.activities && d.activities.length > 0
        );
        const localHasActivities = local?.days?.some(
          (d) => d.activities && d.activities.length > 0
        );
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
      })
      .catch(() => {
        /* best-effort sync */
      })
      .finally(() => setDbSyncDone(true));
  }, [tripId, currentTripId, setCurrentTripId, setItinerary]);

  const isPartialItinerary = !!(itinerary && itinerary.days.length === 0 && tripId !== "guest");
  const generateMutation = useTripGeneration();
  const genFiredRef = useRef(false);
  const genAttemptsRef = useRef(0);

  useEffect(() => {
    if (!isPartialItinerary || !dbSyncDone || genFiredRef.current || !itinerary) return;
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
  }, [isPartialItinerary, dbSyncDone, tripId]);

  const cityActivityMutation = useCityActivityGeneration();
  const [generatingCityId, setGeneratingCityId] = useState<string | null>(null);
  const [cityActivityErrors, setCityActivityErrors] = useState<Record<string, string>>({});

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

  const shouldEnrichAccommodation = !!(
    itinerary &&
    itinerary.days.length > 0 &&
    itinerary.route.length > 0 &&
    !itinerary.accommodationData?.length
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
    const needsAccommodation = accommodationData && !current.accommodationData?.length;
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

  if (!storeReady || !dbSyncDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f9fbff_0%,#ffffff_22%,#f4f7fb_100%)]">
        <div className="border-brand-primary h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent" />
      </div>
    );
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
    setItinerary({ ...itinerary, days: [], visaData: undefined, weatherData: undefined });
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
