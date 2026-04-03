import { useEffect } from "react";
import {
  useVisaEnrichment,
  useWeatherEnrichment,
  useAccommodationEnrichment,
  useHealthEnrichment,
} from "@/hooks/api";
import type { Itinerary, TravelStyle } from "@/types";

interface UseEnrichmentPipelineOptions {
  itinerary: Itinerary | null;
  setItinerary: React.Dispatch<React.SetStateAction<Itinerary | null>>;
  route: Itinerary["route"];
  nationality: string;
  dateStart: string | null;
  travelers: number | null;
  travelStyle: TravelStyle;
}

interface UseEnrichmentPipelineResult {
  visaLoading: boolean;
  weatherLoading: boolean;
  visaError: boolean;
  weatherError: boolean;
  accommodationLoading: boolean;
  accommodationError: boolean;
}

export function useEnrichmentPipeline({
  itinerary,
  setItinerary,
  route,
  nationality,
  dateStart,
  travelers,
  travelStyle,
}: UseEnrichmentPipelineOptions): UseEnrichmentPipelineResult {
  const hasItinerarySkeleton = !!(itinerary && itinerary.days.length > 0 && route.length > 0);

  const shouldEnrich =
    hasItinerarySkeleton && !(itinerary?.visaData?.length && itinerary?.weatherData?.length);
  const shouldEnrichHealth = hasItinerarySkeleton && !itinerary?.healthData?.length;
  const hasAccommodationWithHotels = itinerary?.accommodationData?.some((a) => a.hotels.length > 0);
  const shouldEnrichAccommodation = hasItinerarySkeleton && !hasAccommodationWithHotels;

  const {
    data: visaData,
    isLoading: visaLoading,
    error: visaError,
  } = useVisaEnrichment(nationality, route, shouldEnrich);

  const {
    data: weatherData,
    isLoading: weatherLoading,
    error: weatherError,
  } = useWeatherEnrichment(route, dateStart ?? "", shouldEnrich);

  const { data: healthData } = useHealthEnrichment(route, shouldEnrichHealth);

  const {
    data: accommodationData,
    isLoading: accommodationLoading,
    error: accommodationError,
  } = useAccommodationEnrichment(
    route,
    dateStart ?? "",
    travelers ?? 2,
    travelStyle,
    shouldEnrichAccommodation
  );

  useEffect(() => {
    if (!visaData && !weatherData && !accommodationData && !healthData) return;
    setItinerary((prev) => {
      if (!prev || prev.days.length === 0) return prev;
      const needsVisa = visaData && !prev.visaData?.length;
      const needsWeather = weatherData && !prev.weatherData?.length;
      const needsAccommodation =
        accommodationData?.some((a) => a.hotels.length > 0) &&
        !prev.accommodationData?.some((a) => a.hotels.length > 0);
      const needsHealth = healthData && !prev.healthData?.length;
      if (!needsVisa && !needsWeather && !needsAccommodation && !needsHealth) return prev;
      return {
        ...prev,
        ...(needsVisa ? { visaData } : {}),
        ...(needsWeather ? { weatherData } : {}),
        ...(needsAccommodation ? { accommodationData } : {}),
        ...(needsHealth ? { healthData } : {}),
      };
    });
  }, [visaData, weatherData, accommodationData, healthData, setItinerary]);

  return {
    visaLoading: shouldEnrich && visaLoading,
    weatherLoading: shouldEnrich && weatherLoading,
    visaError: !!visaError,
    weatherError: !!weatherError,
    accommodationLoading: shouldEnrichAccommodation && accommodationLoading,
    accommodationError: !!accommodationError,
  };
}
