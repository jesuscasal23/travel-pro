"use client";

import { use, useState, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { useItinerary } from "@/hooks/useItinerary";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuthStatus, useTripGeneration, useCityActivityGeneration, useVisaEnrichment, useWeatherEnrichment } from "@/hooks/api";
import { useTripStore } from "@/stores/useTripStore";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { MobileLayout } from "@/components/trip/mobile/MobileLayout";
import { DesktopLayout } from "@/components/trip/desktop/DesktopLayout";

type Params = Promise<{ id: string }>;

export default function TripPage({ params }: { params: Params }) {
  const { id } = use(params);
  const itinerary = useItinerary();
  const route = itinerary?.route ?? [];
  const days = itinerary?.days ?? [];

  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const isMobile = useIsMobile();
  const [activeCityIndex, setActiveCityIndex] = useState<number | null>(null);

  const nationality = useTripStore((s) => s.nationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const travelStyle = useTripStore((s) => s.travelStyle);
  const interests = useTripStore((s) => s.interests);
  const dateStart = useTripStore((s) => s.dateStart);
  const setItinerary = useTripStore((s) => s.setItinerary);
  const needsRegeneration = useTripStore((s) => s.needsRegeneration);
  const setNeedsRegeneration = useTripStore((s) => s.setNeedsRegeneration);

  // ── Detect partial itinerary (no days yet — generation needed) ──────────────
  const isPartialItinerary = !!(itinerary && itinerary.days.length === 0 && id !== "guest");
  const generateMutation = useTripGeneration();
  const genFiredRef = useRef(false);

  // Fire background generation via SSE when we have a partial itinerary
  useEffect(() => {
    if (!isPartialItinerary || genFiredRef.current) return;
    genFiredRef.current = true;

    const profile = { nationality, homeAirport, travelStyle, interests };
    const cities = itinerary!.route.length > 0
      ? itinerary!.route.map((r) => ({
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
      { tripId: id, profile, promptVersion: "v1", cities },
      {
        onSuccess: (result) => {
          if (result) setItinerary(result);
        },
        onError: () => {
          genFiredRef.current = false; // allow retry
        },
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartialItinerary]);

  // ── Per-city activity generation ─────────────────────────────────────────────
  const cityActivityMutation = useCityActivityGeneration();
  const [generatingCityId, setGeneratingCityId] = useState<string | null>(null);

  const handleGenerateActivities = (cityId: string, cityName: string) => {
    setGeneratingCityId(cityId);
    const profile = { nationality, homeAirport, travelStyle, interests };
    cityActivityMutation.mutate(
      { tripId: id, cityId, cityName, profile },
      {
        onSettled: () => setGeneratingCityId(null),
      },
    );
  };

  // ── Background enrichment via React Query ──────────────────────────────────
  const shouldEnrich = !!(
    itinerary &&
    itinerary.days.length > 0 &&
    itinerary.route.length > 0 &&
    !(itinerary.visaData?.length && itinerary.weatherData?.length)
  );

  const { data: visaData, isLoading: visaLoading, error: visaError } = useVisaEnrichment(nationality, itinerary?.route ?? [], shouldEnrich);
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useWeatherEnrichment(itinerary?.route ?? [], dateStart, shouldEnrich);

  // Sync enrichment results back to Zustand store
  useEffect(() => {
    if (!visaData && !weatherData) return;
    const current = useTripStore.getState().itinerary;
    if (!current || current.days.length === 0) return;
    const needsVisa = visaData && !current.visaData?.length;
    const needsWeather = weatherData && !current.weatherData?.length;
    if (!needsVisa && !needsWeather) return;
    setItinerary({
      ...current,
      ...(needsVisa ? { visaData } : {}),
      ...(needsWeather ? { weatherData } : {}),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visaData, weatherData]);

  useEffect(() => {
    posthog?.capture("itinerary_viewed", { trip_id: id, city_count: route.length });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Early return for null itinerary — all hooks must be called above this line
  if (!itinerary) {
    return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
  }

  // Wait for hydration so we pick the correct layout on first paint
  if (isMobile === null) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero skeleton */}
        <div className="w-full h-56 bg-secondary animate-pulse" />

        {/* Content skeleton */}
        <div className="max-w-[960px] mx-auto px-4 py-6 space-y-6">
          {/* City cards row */}
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex-shrink-0 w-24 h-32 rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>

          {/* Day pills row */}
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="w-20 h-7 rounded-full bg-secondary animate-pulse" />
            ))}
          </div>

          {/* Activity card skeletons */}
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { budget } = itinerary;
  const countries = [...new Set(route.map((r) => r.country))];
  const singleCity = route.length === 1;
  const tripTitle = singleCity ? `${route[0].city}, ${route[0].country}` : countries.join(", ");
  const totalDays = days.length || route.reduce((sum, r) => sum + r.days, 0);

  const generationError = generateMutation.error
    ? (generateMutation.error.message === "Generation failed"
        ? "Generation failed. Please try again."
        : "Something went wrong. Please try again.")
    : null;
  const isGenerating = isPartialItinerary && !generationError;

  // Regenerate after structural route edit (add/remove city)
  const handleRegenerate = () => {
    setNeedsRegeneration(false);
    genFiredRef.current = false;
    generateMutation.reset();
    setItinerary({ ...itinerary!, days: [], visaData: undefined, weatherData: undefined });
  };

  // Retry generation after an error
  const handleRetry = () => {
    genFiredRef.current = false;
    generateMutation.reset();

    const profile = { nationality, homeAirport, travelStyle, interests };
    const cities = itinerary.route.length > 0
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
      { tripId: id, profile, promptVersion: "v1", cities },
      {
        onSuccess: (result) => {
          if (result) setItinerary(result);
        },
        onError: () => {
          genFiredRef.current = false;
        },
      },
    );
  };

  const sharedProps = {
    itinerary,
    tripId: id,
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
    generatingCityId,
    onGenerateActivities: handleGenerateActivities,
  };

  if (isMobile) {
    return <MobileLayout {...sharedProps} />;
  }

  return (
    <DesktopLayout
      {...sharedProps}
      activeCityIndex={activeCityIndex}
      onCityClick={setActiveCityIndex}
    />
  );
}
