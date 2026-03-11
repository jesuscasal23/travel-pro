"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTripStore } from "@/stores/useTripStore";
import { useToastStore } from "@/stores/useToastStore";
import { ProgressBar } from "@/components/v2/ui/ProgressBar";
import { Button } from "@/components/v2/ui/Button";
import {
  useAuthStatus,
  useProfile,
  usePrefetchRouteSelection,
  useFetchRouteSelection,
  buildCacheKey,
  useCreateTrip,
  useSaveProfile,
} from "@/hooks/api";
import { slideVariants } from "@/lib/animations";
import { DestinationStep } from "./steps/DestinationStep";
import { ScheduleStep } from "./steps/ScheduleStep";
import { StyleStep } from "./steps/StyleStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { ProfileStep } from "./steps/ProfileStep";
import type { CityStop, Itinerary } from "@/types";
import {
  validate,
  onboardingStep1Schema,
  destinationStepSchema,
  detailsStepSchema,
} from "@/lib/forms/schemas";
import type { CityWithDays } from "@/lib/flights/types";

export default function PlanPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const hydratedProfileRef = useRef(false);
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

  const prefetchRoute = usePrefetchRouteSelection();
  const fetchRoute = useFetchRouteSelection();
  const createTripMutation = useCreateTrip();
  const saveProfileMutation = useSaveProfile();
  const { data: persistedProfile } = useProfile({ enabled: isAuthenticated === true });
  const toast = useToastStore((s) => s.toast);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (field: string) =>
    setErrors((prev) => {
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });

  const isSingleCity = tripType === "single-city";
  const isSingleCountry = tripType === "single-country";
  const isMultiCountry = tripType === "multi-city";
  const effectiveNationality = nationality || persistedProfile?.nationality || "";
  const effectiveHomeAirport = homeAirport || persistedProfile?.homeAirport || "";
  const hasCoreProfile = Boolean(effectiveNationality && effectiveHomeAirport);
  const canSkipProfileStep = isAuthenticated === true && hasCoreProfile;
  const needsProfileStep = !canSkipProfileStep;
  const totalSteps = needsProfileStep ? 5 : 4;

  useEffect(() => {
    if (hydratedProfileRef.current || !persistedProfile) return;
    if (nationality || homeAirport) return;

    useTripStore.setState({
      nationality: persistedProfile.nationality,
      homeAirport: persistedProfile.homeAirport,
      travelStyle: persistedProfile.travelStyle,
      interests: persistedProfile.interests,
      pace: persistedProfile.pace ?? "moderate",
    });
    hydratedProfileRef.current = true;
  }, [persistedProfile, nationality, homeAirport]);

  // Clamp persisted planStep to valid range
  const step = Math.min(Math.max(planStep, 1), totalSteps);

  // Which content to show based on step + profile completeness
  const showDestination = step === 1;
  const showSchedule = step === 2;
  const showStyle = step === 3;
  const showPreferences = step === 4;
  const showProfileAndDescription = needsProfileStep && step === 5;
  const isFinalStep = step === totalSteps;
  const progress = Math.round((step / totalSteps) * 100);

  // Speculative route selection: prefetch when user reaches destination step.
  useEffect(() => {
    if (isSingleCity || !dateStart || !dateEnd) return;
    if (step < 2) return;
    if (isSingleCountry && !destinationCountry) return;
    if (isMultiCountry && !region) return;

    const cacheKey = buildCacheKey({ region, destinationCountry, dateStart, dateEnd, travelStyle });
    const params = {
      profile: {
        nationality: effectiveNationality,
        homeAirport: effectiveHomeAirport,
        travelStyle,
        interests,
        pace,
      },
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
    step,
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
    if (showDestination) {
      const hasDestination = isSingleCity
        ? !!destination
        : isSingleCountry
          ? !!destinationCountry
          : !!region;
      return hasDestination;
    }
    if (showSchedule) {
      return !!dateStart && !!dateEnd && dayCount > 0 && travelers > 0;
    }
    if (showStyle || showPreferences) {
      return true;
    }
    if (showProfileAndDescription) {
      return !!effectiveNationality && !!effectiveHomeAirport;
    }
    return true;
  };

  const goNext = () => {
    if (showDestination) {
      const nextErrors: Record<string, string> = {};
      if (isMultiCountry && !region) nextErrors.region = "Please select a region";
      if (isSingleCity && !destination) nextErrors.destination = "Please select a city";
      if (isSingleCountry && !destinationCountry) {
        nextErrors.destinationCountry = "Please select a country";
      }
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }
    }
    if (showSchedule) {
      const fieldErrors = validate(destinationStepSchema, {
        tripType,
        region,
        destination,
        destinationCountry,
        dateStart,
        dateEnd,
      });
      const detailErrors = validate(detailsStepSchema, { travelers });
      if (fieldErrors || detailErrors) {
        setErrors({ ...(fieldErrors ?? {}), ...(detailErrors ?? {}) });
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
    if (needsProfileStep) {
      const profileErrors = validate(onboardingStep1Schema, {
        nationality: effectiveNationality,
        homeAirport: effectiveHomeAirport,
      });
      if (profileErrors) {
        setErrors(profileErrors);
        return;
      }
    }

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
        profile: {
          nationality: effectiveNationality,
          homeAirport: effectiveHomeAirport,
          travelStyle,
          interests,
          pace,
        },
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
      if (isAuthenticated === true) {
        await saveProfileMutation.mutateAsync({
          nationality: effectiveNationality,
          homeAirport: effectiveHomeAirport,
          travelStyle,
          interests,
          pace,
          onboardingCompleted: true,
        });
      }

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
      if (isAuthenticated === true) {
        toast({
          title: "Profile save failed",
          description: "We couldn't save your profile, so trip creation was stopped.",
          variant: "error",
        });
      }
    }
  }, [
    needsProfileStep,
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
    effectiveNationality,
    effectiveHomeAirport,
    travelStyle,
    interests,
    setIsGenerating,
    setCurrentTripId,
    setItinerary,
    pace,
    saveProfileMutation,
    citiesToRoute,
    singleCityRoute,
    buildPartialItinerary,
    fetchRoute,
    createTripMutation,
    router,
    posthog,
    isAuthenticated,
    toast,
  ]);

  const stepLabel = showDestination
    ? "Trip Basics"
    : showSchedule
      ? "Dates"
      : showStyle
        ? "Travel Style"
        : showPreferences
          ? "Preferences"
          : "About You";

  const stepHelp = showDestination
    ? "Choose the trip format and destination before we map the rest."
    : showSchedule
      ? "Lock in the dates and group size so routing and pacing stay realistic."
      : showStyle
        ? "Pick the overall level of comfort and budget for this trip."
        : showPreferences
          ? needsProfileStep
            ? "Set the pace and interests so the first itinerary draft feels personal."
            : "Set the pace, interests, and any special requests before we generate the trip."
          : "We use these details for visa checks, flights, and your final itinerary.";

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <ProgressBar progress={progress} />

      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className={`text-v2-text-muted hover:text-v2-navy flex items-center gap-1 text-sm font-medium transition-colors ${
              step === 1 ? "pointer-events-none opacity-0" : ""
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="text-right">
            <p className="text-v2-text-muted text-[11px] font-bold tracking-[0.22em] uppercase">
              {stepLabel}
            </p>
            <p className="text-v2-navy mt-1 text-sm font-semibold">
              Step {step} of {totalSteps}
            </p>
          </div>
        </div>

        <p className="text-v2-text-muted mb-4 text-sm">{stepHelp}</p>

        <div className="relative overflow-x-clip overflow-y-visible">
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
              {showSchedule && <ScheduleStep errors={errors} clearError={clearError} />}
              {showStyle && <StyleStep />}
              {showPreferences && <PreferencesStep includeTripDescription={!needsProfileStep} />}
              {showProfileAndDescription && <ProfileStep errors={errors} clearError={clearError} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {createTripMutation.error && (
          <p className="text-v2-red mt-5 text-center text-sm">
            {createTripMutation.error.message || "Something went wrong. Please try again."}
          </p>
        )}
      </div>

      <div className="border-v2-border shrink-0 border-t bg-white px-6 pt-4 pb-8">
        <p className="text-v2-text-muted mb-3 text-sm">
          {isFinalStep
            ? "We’ll open your trip as soon as the first itinerary draft is ready."
            : "You can adjust any of these details again after the next step."}
        </p>

        {isFinalStep ? (
          <Button
            onClick={() => handleGenerate()}
            disabled={!canAdvance() || isGenerating}
            className="flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating trip...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate My Itinerary
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={goNext}
            disabled={!canAdvance()}
            className="flex items-center justify-center gap-2"
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
