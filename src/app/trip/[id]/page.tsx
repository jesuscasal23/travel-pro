"use client";

import { use, useState, useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { useItinerary } from "@/hooks/useItinerary";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  useAuthStatus,
  useTripGeneration,
  useCityActivityGeneration,
  useVisaEnrichment,
  useWeatherEnrichment,
  useAccommodationEnrichment,
} from "@/hooks/api";
import { useTripStore } from "@/stores/useTripStore";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { MobileLayout } from "@/components/trip/mobile/MobileLayout";
import { DesktopLayout } from "@/components/trip/desktop/DesktopLayout";
import { getCityHeroImage } from "@/lib/utils/city-images";
import type { Itinerary } from "@/types";

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
  const currentTripId = useTripStore((s) => s.currentTripId);
  const setCurrentTripId = useTripStore((s) => s.setCurrentTripId);
  const setItinerary = useTripStore((s) => s.setItinerary);
  const needsRegeneration = useTripStore((s) => s.needsRegeneration);
  const setNeedsRegeneration = useTripStore((s) => s.setNeedsRegeneration);

  // ── Sync Zustand store with DB on mount (non-guest trips) ───────────────────
  // dbSyncDone gates generation: we wait for the DB check to resolve before
  // firing generation so that a complete DB itinerary can overwrite a stale
  // partial store value before we decide whether to generate.  Without this
  // gate the generation effect fires on the first render where isPartialItinerary
  // is true (from persisted localStorage) even though the DB already holds a
  // complete result, causing a redundant generation request and overwriting the
  // DB-synced itinerary.  Guest trips skip the sync entirely, so we start done.
  const [dbSyncDone, setDbSyncDone] = useState(id === "guest");
  const syncFiredRef = useRef(false);
  useEffect(() => {
    if (id === "guest" || syncFiredRef.current) return;
    syncFiredRef.current = true;

    fetch(`/api/v1/trips/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.trip?.itineraries?.[0]?.data) return;
        const dbItinerary = data.trip.itineraries[0].data as Itinerary;
        // Only update if the DB version has data the local store lacks
        const local = useTripStore.getState().itinerary;
        const localTripId = useTripStore.getState().currentTripId;
        const dbHasActivities = dbItinerary.days?.some(
          (d: { activities?: unknown[] }) => d.activities && d.activities.length > 0
        );
        const localHasActivities = local?.days?.some(
          (d) => d.activities && d.activities.length > 0
        );
        const shouldSync =
          localTripId !== id ||
          !local ||
          local.route.length === 0 ||
          (local.days.length === 0 && dbItinerary.route.length > 0) ||
          (dbHasActivities && !localHasActivities);

        if (shouldSync) {
          setCurrentTripId(id);
          setItinerary(dbItinerary);
        }
      })
      .catch(() => {
        /* best-effort sync */
      })
      .finally(() => setDbSyncDone(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentTripId]);

  // ── Detect partial itinerary (no days yet — generation needed) ──────────────
  const isPartialItinerary = !!(itinerary && itinerary.days.length === 0 && id !== "guest");
  const generateMutation = useTripGeneration();
  const genFiredRef = useRef(false);

  // Fire background generation via SSE when we have a partial itinerary.
  // Gated on dbSyncDone so the DB sync above gets a chance to overwrite a
  // stale partial store value with a complete itinerary before we generate.
  useEffect(() => {
    if (!isPartialItinerary || !dbSyncDone || genFiredRef.current) return;
    genFiredRef.current = true;

    const profile = { nationality, homeAirport, travelStyle, interests };
    const cities =
      itinerary!.route.length > 0
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
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartialItinerary, dbSyncDone]);

  // ── Per-city activity generation ─────────────────────────────────────────────
  const cityActivityMutation = useCityActivityGeneration();
  const [generatingCityId, setGeneratingCityId] = useState<string | null>(null);

  const handleGenerateActivities = (cityId: string, cityName: string) => {
    setGeneratingCityId(cityId);
    const profile = { nationality, homeAirport, travelStyle, interests };
    cityActivityMutation.mutate(
      { tripId: id, cityId, cityName, profile },
      {
        onSuccess: (mergedItinerary) => {
          setItinerary(mergedItinerary);
        },
        onSettled: () => setGeneratingCityId(null),
      }
    );
  };

  // ── Background enrichment via React Query ──────────────────────────────────
  const travelers = useTripStore((s) => s.travelers);

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
    travelStyle || "comfort",
    shouldEnrichAccommodation
  );

  // Sync enrichment results back to Zustand store
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visaData, weatherData, accommodationData]);

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
    const heroStop = route[0];
    const heroImage = heroStop ? getCityHeroImage(heroStop.city, heroStop.countryCode) : null;

    return (
      <div className="bg-background min-h-screen">
        {/* Hero skeleton with real image if available */}
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
              <div className="from-background via-background/30 absolute inset-0 bg-gradient-to-t to-transparent" />
            </>
          ) : (
            <div className="bg-secondary h-full w-full animate-pulse" />
          )}
        </div>

        {/* Content skeleton */}
        <div className="mx-auto max-w-[960px] space-y-6 px-4 py-6">
          {/* City cards row */}
          <div className="flex justify-center gap-3 overflow-hidden">
            {(route.length > 0 ? route : Array.from({ length: 4 })).map((_, i) => (
              <div
                key={i}
                className="bg-secondary h-32 w-24 flex-shrink-0 animate-pulse rounded-2xl"
              />
            ))}
          </div>

          {/* Day pills row */}
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-secondary h-7 w-20 animate-pulse rounded-full" />
            ))}
          </div>

          {/* Activity card skeletons */}
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-secondary h-20 animate-pulse rounded-xl" />
          ))}
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
      { tripId: id, profile, promptVersion: "v1", cities },
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
    accommodationLoading: accommodationLoading && shouldEnrichAccommodation,
    accommodationError: !!accommodationError,
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
