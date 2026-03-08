"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTripStore } from "@/stores/useTripStore";
import { Button } from "@/components/ui";
import { Navbar } from "@/components/Navbar";
import { StepProgress } from "@/components/ui/StepProgress";
import {
  useAuthStatus,
  usePrefetchRouteSelection,
  useFetchRouteSelection,
  buildCacheKey,
  useCreateTrip,
} from "@/hooks/api";
import { slideVariants } from "@/lib/animations";
import { DestinationStep } from "./steps/DestinationStep";
import { StyleStep } from "./steps/StyleStep";
import { ProfileStep } from "./steps/ProfileStep";
import type { CityStop, Itinerary } from "@/types";
import {
  validate,
  onboardingStep1Schema,
  destinationStepSchema,
  detailsStepSchema,
} from "@/lib/api/schemas";
import type { CityWithDays } from "@/lib/flights/types";

export default function PlanPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const [direction, setDirection] = useState(1);

  const {
    planStep,
    setPlanStep,
    nationality,
    homeAirport,
    travelStyle,
    interests,
    pace,
    tripType,
    tripDescription,
    region,
    destination,
    destinationCountry,
    destinationCountryCode,
    destinationLat,
    destinationLng,
    dateStart,
    dateEnd,
    travelers,
    isGenerating,
    setIsGenerating,
    setCurrentTripId,
    setItinerary,
  } = useTripStore();

  // Treat as guest unless auth explicitly confirmed
  const hasCoreProfile = Boolean(nationality && homeAirport);
  const isGuest = isAuthenticated !== true || !hasCoreProfile;

  const prefetchRoute = usePrefetchRouteSelection();
  const fetchRoute = useFetchRouteSelection();
  const createTripMutation = useCreateTrip();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (field: string) =>
    setErrors((prev) => {
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });

  const isSingleCity = tripType === "single-city";
  const isSingleCountry = tripType === "single-country";
  const isMultiCountry = tripType === "multi-city";
  const totalSteps = isGuest ? 3 : 2;

  // Clamp persisted planStep to valid range
  const step = Math.min(Math.max(planStep, 1), totalSteps);

  // Which content to show based on step + auth
  const showDestination = step === 1;
  const showStyle = isGuest && step === 2;
  const showProfileAndDescription = isGuest ? step === 3 : step === 2;

  // Speculative route selection: prefetch when user reaches destination step.
  useEffect(() => {
    if (isSingleCity || !dateStart || !dateEnd) return;
    if (!showDestination) return;
    if (isSingleCountry && !destinationCountry) return;
    if (isMultiCountry && !region) return;

    const cacheKey = buildCacheKey({ region, destinationCountry, dateStart, dateEnd, travelStyle });
    const params = {
      profile: { nationality, homeAirport, travelStyle, interests, pace },
      tripIntent: {
        id: "speculative",
        tripType,
        region,
        destinationCountry,
        destinationCountryCode,
        dateStart,
        dateEnd,
        travelers,
      },
    };
    prefetchRoute(params, cacheKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showDestination,
    isSingleCity,
    isSingleCountry,
    isMultiCountry,
    region,
    destinationCountry,
    dateStart,
    dateEnd,
    travelStyle,
  ]);

  const dayCount = (() => {
    if (!dateStart || !dateEnd) return 0;
    return Math.max(
      0,
      Math.round((new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / 86400000)
    );
  })();

  const canAdvance = () => {
    if (showStyle) return true;
    if (showProfileAndDescription) return !!nationality;
    if (showDestination) {
      const hasDestination = isSingleCity
        ? !!destination
        : isSingleCountry
          ? !!destinationCountry
          : !!region;
      return hasDestination && !!dateStart && !!dateEnd && dayCount > 0 && travelers > 0;
    }
    return true;
  };

  const goNext = () => {
    if (showProfileAndDescription) {
      const fieldErrors = validate(onboardingStep1Schema, { nationality, homeAirport });
      if (fieldErrors) {
        setErrors(fieldErrors);
        return;
      }
    }
    if (showDestination) {
      const fieldErrors = validate(destinationStepSchema, {
        tripType,
        region,
        destination,
        destinationCountry,
        dateStart,
        dateEnd,
      });
      if (fieldErrors) {
        setErrors(fieldErrors);
        return;
      }
      const detailErrors = validate(detailsStepSchema, { travelers });
      if (detailErrors) {
        setErrors(detailErrors);
        return;
      }
    }
    setErrors({});
    setDirection(1);
    setPlanStep(step + 1);
  };

  const goBack = () => {
    setErrors({});
    setDirection(-1);
    setPlanStep(step - 1);
  };

  // ── Helper: convert CityWithDays[] → CityStop[] for partial itinerary ────
  const citiesToRoute = useCallback(
    (cities: CityWithDays[]): CityStop[] => {
      const raw = cities.map((c) => ({
        id: c.id,
        city: c.city,
        country: c.country,
        countryCode: c.countryCode,
        lat: c.lat,
        lng: c.lng,
        days: Math.round((c.minDays + c.maxDays) / 2),
        iataCode: c.iataCode || undefined,
      }));

      const total = raw.reduce((s, c) => s + c.days, 0);
      if (dayCount > 0 && total > dayCount) {
        const scale = dayCount / total;
        let remaining = dayCount;
        for (let i = 0; i < raw.length; i++) {
          if (i === raw.length - 1) {
            raw[i].days = Math.max(1, remaining);
          } else {
            raw[i].days = Math.max(1, Math.round(raw[i].days * scale));
            remaining -= raw[i].days;
          }
        }
      }

      return raw;
    },
    [dayCount]
  );

  const singleCityRoute = useCallback((): CityStop[] => {
    if (!destination) return [];
    return [
      {
        id: destination.toLowerCase().replace(/\s+/g, "-"),
        city: destination,
        country: destinationCountry,
        countryCode: destinationCountryCode,
        lat: destinationLat,
        lng: destinationLng,
        days: dayCount || 7,
      },
    ];
  }, [
    destination,
    destinationCountry,
    destinationCountryCode,
    destinationLat,
    destinationLng,
    dayCount,
  ]);

  const buildPartialItinerary = useCallback(
    (route: CityStop[]): Itinerary => ({
      route,
      days: [],
    }),
    []
  );

  const handleGenerate = useCallback(async () => {
    const fieldErrors = validate(destinationStepSchema, {
      tripType,
      region,
      destination,
      destinationCountry,
      dateStart,
      dateEnd,
    });
    if (fieldErrors) {
      setErrors(fieldErrors);
      return;
    }
    const detailErrors = validate(detailsStepSchema, { travelers });
    if (detailErrors) {
      setErrors(detailErrors);
      return;
    }
    setErrors({});

    posthog?.capture("questionnaire_completed", {
      tripType,
      region,
      destination,
      duration_days: dayCount,
      travelers,
    });
    setIsGenerating(true);

    let route: CityStop[] = [];

    if (isSingleCity) {
      route = singleCityRoute();
    } else {
      const cacheKey = buildCacheKey({
        region,
        destinationCountry,
        dateStart,
        dateEnd,
        travelStyle,
      });
      const params = {
        profile: { nationality, homeAirport, travelStyle, interests, pace },
        tripIntent: {
          id: "speculative",
          tripType,
          region,
          destinationCountry,
          destinationCountryCode,
          dateStart,
          dateEnd,
          travelers,
        },
      };

      try {
        const cities = await fetchRoute(params, cacheKey);
        if (cities && cities.length > 0) {
          route = citiesToRoute(cities);
        }
      } catch {
        // Route selection failed — proceed without pre-selected cities
      }
    }

    try {
      const { trip } = await createTripMutation.mutateAsync({
        tripType,
        region: isMultiCountry ? region : "",
        ...(isSingleCity
          ? { destination, destinationCountry, destinationCountryCode }
          : isSingleCountry
            ? { destinationCountry, destinationCountryCode }
            : {}),
        dateStart,
        dateEnd,
        travelers,
        ...(tripDescription.trim() ? { description: tripDescription.trim() } : {}),
      });

      setItinerary(buildPartialItinerary(route));
      setCurrentTripId(trip.id);
      posthog?.capture("itinerary_generation_started", { trip_id: trip.id, region });
      router.push(`/trip/${trip.id}`);
    } catch {
      setIsGenerating(false);
    }
  }, [
    isSingleCity,
    isSingleCountry,
    isMultiCountry,
    tripType,
    region,
    tripDescription,
    destination,
    destinationCountry,
    destinationCountryCode,
    dateStart,
    dateEnd,
    travelers,
    dayCount,
    nationality,
    homeAirport,
    travelStyle,
    interests,
    setIsGenerating,
    setCurrentTripId,
    setItinerary,
    pace,
    citiesToRoute,
    singleCityRoute,
    buildPartialItinerary,
    fetchRoute,
    createTripMutation,
    router,
    posthog,
  ]);

  return (
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated={isAuthenticated ?? false} />

      <div className="mx-auto max-w-xl px-4 pt-24 pb-12">
        {/* Progress */}
        <StepProgress step={step} totalSteps={totalSteps} />

        <div className="relative -mx-1 overflow-x-clip overflow-y-visible px-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {showDestination && <DestinationStep errors={errors} clearError={clearError} />}
              {showStyle && <StyleStep />}
              {showProfileAndDescription && <ProfileStep errors={errors} clearError={clearError} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={goBack}
            className={`text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors ${step === 1 ? "pointer-events-none opacity-0" : ""}`}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step < totalSteps ? (
            <Button onClick={goNext} disabled={!canAdvance()} size="sm" className="gap-1.5">
              Continue
            </Button>
          ) : (
            <Button
              onClick={() => handleGenerate()}
              disabled={!canAdvance()}
              loading={isGenerating}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Creating trip..." : "Generate My Itinerary"}
            </Button>
          )}
        </div>

        {createTripMutation.error && (
          <p className="text-accent mt-4 text-center text-sm">
            {createTripMutation.error.message || "Something went wrong. Please try again."}
          </p>
        )}
      </div>
    </div>
  );
}
