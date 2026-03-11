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
import { useTripStore } from "@/stores/useTripStore";
import { useItinerary } from "@/hooks/useItinerary";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { TripProvider, type TripContextValue } from "@/components/trip/TripContext";
import { getCityHeroImage } from "@/lib/utils/city-images";
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

  useEffect(() => {
    if (!isPartialItinerary || !dbSyncDone || genFiredRef.current || !itinerary) return;
    genFiredRef.current = true;

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
  }, [
    isPartialItinerary,
    dbSyncDone,
    itinerary,
    nationality,
    homeAirport,
    travelStyle,
    interests,
    tripId,
    setItinerary,
    generateMutation,
  ]);

  const cityActivityMutation = useCityActivityGeneration();
  const [generatingCityId, setGeneratingCityId] = useState<string | null>(null);

  const handleGenerateActivities = (cityId: string, cityName: string) => {
    setGeneratingCityId(cityId);
    const profile = { nationality, homeAirport, travelStyle, interests };
    cityActivityMutation.mutate(
      { tripId, cityId, cityName, profile },
      {
        onSuccess: (mergedItinerary) => {
          setItinerary(mergedItinerary);
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

  if (!itinerary) {
    return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
  }

  if (!dbSyncDone) {
    const heroStop = route[0];
    const heroImage = heroStop ? getCityHeroImage(heroStop.city, heroStop.countryCode) : null;

    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f9fbff_0%,#ffffff_22%,#f4f7fb_100%)]">
        <div className="relative h-56 w-full overflow-hidden">
          {heroImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt=""
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,19,39,0.14)_0%,rgba(9,19,39,0.28)_36%,rgba(9,19,39,0.72)_100%)]" />
            </>
          ) : (
            <div className="h-full w-full animate-pulse bg-[#eef4fb]" />
          )}
        </div>
        <div className="space-y-4 px-6 py-6">
          <div className="h-24 animate-pulse rounded-[28px] bg-white/70" />
          <div className="h-16 animate-pulse rounded-[24px] bg-white/70" />
          <div className="h-52 animate-pulse rounded-[30px] bg-white/70" />
        </div>
      </div>
    );
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
    cityActivityErrors: {},
    onGenerateActivities: handleGenerateActivities,
  };

  return <TripProvider value={contextValue}>{children}</TripProvider>;
}
