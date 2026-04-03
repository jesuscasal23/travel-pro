/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState, useCallback } from "react";
import { usePostHog } from "posthog-js/react";
import { daysBetween } from "@/lib/utils/format/date";
import { buildTripPresentation } from "@/lib/utils/trip/presentation";
import type { Itinerary, CityAccommodation } from "@/types";

interface UseItinerarySyncOptions {
  tripId: string;
  tripData: ReturnType<typeof import("@/hooks/api").useTrip>["data"];
  tripQueryPending: boolean;
  tripQueryEnabled: boolean;
  tripTitleFallback?: string;
  dateStart: string | null;
  dateEnd: string | null;
}

interface UseItinerarySyncResult {
  itinerary: Itinerary | null;
  setItinerary: React.Dispatch<React.SetStateAction<Itinerary | null>>;
  route: Itinerary["route"];
  countries: string[];
  cityNames: string[];
  tripTitle: string;
  totalDays: number;
  onAccommodationLoaded: (data: CityAccommodation[]) => void;
}

export function useItinerarySync({
  tripId,
  tripData,
  tripQueryPending,
  tripQueryEnabled,
  tripTitleFallback,
  dateStart,
  dateEnd,
}: UseItinerarySyncOptions): UseItinerarySyncResult {
  const [localItinerary, setLocalItinerary] = useState<Itinerary | null>(null);
  const localTripIdRef = useRef<string | null>(null);
  const posthog = usePostHog();

  useEffect(() => {
    if (!tripQueryEnabled || tripQueryPending) return;

    if (tripData === null) {
      localTripIdRef.current = null;
      setLocalItinerary(null);
      return;
    }

    const dbItinerary = tripData?.itineraries?.[0]?.data as Itinerary | undefined;
    if (!dbItinerary) {
      if (localTripIdRef.current !== tripId) {
        localTripIdRef.current = tripId;
        setLocalItinerary(null);
      }
      return;
    }

    const dbHasActivities = dbItinerary.days?.some(
      (d: { activities?: unknown[] }) => Array.isArray(d.activities) && d.activities.length > 0
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
  }, [tripId, tripData, tripQueryPending, tripQueryEnabled]);

  const route = localItinerary?.route ?? [];

  useEffect(() => {
    if (route.length > 0) {
      posthog?.capture("itinerary_viewed", { trip_id: tripId, city_count: route.length });
    }
  }, [posthog, tripId, route.length]);

  const presentation = buildTripPresentation({
    destination: tripTitleFallback,
    route,
    fallbackTitle: tripTitleFallback ?? "Untitled Trip",
    fallbackLabel: tripTitleFallback ?? "Trip",
  });
  const { countries, cityNames, tripTitle } = presentation;

  const routeDays = route.reduce((sum, r) => sum + r.days, 0);
  const fallbackDays = dateStart && dateEnd ? daysBetween(dateStart, dateEnd) : 0;
  const totalDays = localItinerary?.days.length || routeDays || fallbackDays;

  const handleAccommodationLoaded = useCallback((data: CityAccommodation[]) => {
    setLocalItinerary((prev) => (prev ? { ...prev, accommodationData: data } : prev));
  }, []);

  return {
    itinerary: localItinerary,
    setItinerary: setLocalItinerary,
    route,
    countries,
    cityNames,
    tripTitle,
    totalDays,
    onAccommodationLoaded: handleAccommodationLoaded,
  };
}
