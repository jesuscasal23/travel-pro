"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTripStore } from "@/stores/useTripStore";
import { useToastStore } from "@/stores/useToastStore";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import {
  useAuthStatus,
  useProfile,
  useFetchRouteSelection,
  buildCacheKey,
  useCreateTrip,
  useSaveProfile,
} from "@/hooks/api";
import { slideVariants } from "@/lib/animations";
import { normalizeInterests } from "@/lib/features/profile/interests";
import { DestinationStep } from "./steps/DestinationStep";
import { ProfileStep } from "./steps/ProfileStep";
import { PrioritiesStep } from "./steps/PrioritiesStep";
import { OverviewStep } from "./steps/OverviewStep";
import type { CityStop, Itinerary } from "@/types";
import { validate, onboardingStep1Schema, destinationStepSchema } from "@/lib/forms/schemas";
import { citiesToRoute } from "@/lib/utils/trip/cities-to-route";
import { daysBetween } from "@/lib/utils/format/date";

export default function PlanPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const hydratedProfileRef = useRef(false);
  const [direction, setDirection] = useState(1);
  const [generateError, setGenerateError] = useState<string | null>(null);

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
    planningPriorities,
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

  const fetchRoute = useFetchRouteSelection();
  const createTripMutation = useCreateTrip();
  const saveProfileMutation = useSaveProfile();
  const { data: persistedProfile } = useProfile({ enabled: isAuthenticated === true });
  const toast = useToastStore((s) => s.toast);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (field: string) =>
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });

  const isSingleCity = tripType === "single-city";
  const isSingleCountry = tripType === "single-country";
  const isMultiCountry = tripType === "multi-city";
  const effectiveNationality = nationality || persistedProfile?.nationality || "";
  const effectiveHomeAirport = homeAirport || persistedProfile?.homeAirport || "";
  const hasCoreProfile = Boolean(effectiveNationality && effectiveHomeAirport);
  const canSkipProfileStep = isAuthenticated === true && hasCoreProfile;
  const needsProfileStep = !canSkipProfileStep;
  const totalSteps = needsProfileStep ? 4 : 3;

  useEffect(() => {
    if (hydratedProfileRef.current || !persistedProfile) return;
    if (!persistedProfile.nationality || !persistedProfile.homeAirport) return;

    useTripStore.setState({
      nationality: persistedProfile.nationality,
      homeAirport: persistedProfile.homeAirport,
      travelStyle: persistedProfile.travelStyle,
      interests: normalizeInterests(persistedProfile.interests),
      pace: persistedProfile.pace ?? "moderate",
    });
    hydratedProfileRef.current = true;
  }, [persistedProfile]);

  // Clamp persisted planStep to valid range
  const step = Math.min(Math.max(planStep, 1), totalSteps);

  // Which content to show based on step + profile completeness
  const showDestination = step === 1;
  const showDetails = needsProfileStep ? step === 2 : false;
  const showPriorities = needsProfileStep ? step === 3 : step === 2;
  const showOverview = needsProfileStep ? step === 4 : step === 3;
  const isFinalStep = step === totalSteps;
  const progress = Math.round((step / totalSteps) * 100);

  const dayCount = dateStart && dateEnd ? Math.max(0, daysBetween(dateStart, dateEnd)) : 0;

  const canAdvance = () => {
    if (showDestination) {
      const hasDestination = isSingleCity
        ? !!destination
        : isSingleCountry
          ? !!destinationCountry
          : !!region;
      return hasDestination && !!dateStart && !!dateEnd && dayCount > 0;
    }
    if (showDetails) {
      return !!effectiveNationality && !!effectiveHomeAirport;
    }
    if (showPriorities) {
      return planningPriorities.length > 0;
    }
    if (showOverview) {
      return true;
    }
    return true;
  };

  const goNext = () => {
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
    }
    if (showDetails) {
      const profileErrors = validate(onboardingStep1Schema, {
        nationality: effectiveNationality,
        homeAirport: effectiveHomeAirport,
      });
      if (profileErrors) {
        setErrors(profileErrors);
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

  const prioritySummary =
    planningPriorities.length === 0
      ? ""
      : planningPriorities.length === 1
        ? `Primary challenge: ${planningPriorities[0]}`
        : `Top challenges: ${planningPriorities.join(", ")}`;

  const handleGenerate = useCallback(async () => {
    if (isAuthenticated !== true) {
      router.push(`/signup?next=${encodeURIComponent("/plan")}`);
      return;
    }

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
    setErrors({});
    setGenerateError(null);

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
      const cacheKey = buildCacheKey(params);

      try {
        const cities = await fetchRoute(params, cacheKey);
        if (cities && cities.length > 0) {
          route = citiesToRoute(cities, dayCount);
        }
      } catch {
        // Route selection failed — proceed without pre-selected cities
      }
    }

    const combinedDescription = [tripDescription.trim(), prioritySummary]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (isAuthenticated === true) {
      try {
        await saveProfileMutation.mutateAsync({
          nationality: effectiveNationality,
          homeAirport: effectiveHomeAirport,
          travelStyle,
          interests,
          pace,
          onboardingCompleted: true,
        });
      } catch {
        setIsGenerating(false);
        toast({
          title: "Profile save failed",
          description: "We couldn't save your profile, so trip creation was stopped.",
          variant: "error",
        });
        return;
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
        ...(combinedDescription ? { description: combinedDescription } : {}),
        initialItinerary: buildPartialItinerary(route),
      });

      setItinerary(buildPartialItinerary(route));
      setCurrentTripId(trip.id);
      posthog?.capture("itinerary_generation_started", { trip_id: trip.id, region });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setIsGenerating(false);
      setGenerateError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }, [
    needsProfileStep,
    isSingleCity,
    isSingleCountry,
    isMultiCountry,
    tripType,
    region,
    tripDescription,
    planningPriorities,
    prioritySummary,
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
    singleCityRoute,
    buildPartialItinerary,
    fetchRoute,
    createTripMutation,
    router,
    posthog,
    isAuthenticated,
    toast,
  ]);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[image:var(--gradient-page)]">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[image:var(--glow-top)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[image:var(--glow-bottom)]" />
      <ProgressBar progress={progress} />

      <div className="relative flex-1 overflow-y-auto px-6 pt-4 pb-3">
        <div className="mb-3 flex items-center">
          <button
            type="button"
            onClick={step === 1 ? () => router.push("/home") : goBack}
            aria-label={step === 1 ? "Back to home" : "Go back"}
            className="hover:text-navy text-back-btn shadow-back-btn flex h-12 w-12 items-center justify-center rounded-2xl bg-white/92 backdrop-blur-sm transition-colors"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

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
              {showDestination && (
                <DestinationStep
                  errors={errors}
                  clearError={clearError}
                  step={step}
                  totalSteps={totalSteps}
                />
              )}
              {showDetails && (
                <ProfileStep
                  errors={errors}
                  clearError={clearError}
                  step={step}
                  totalSteps={totalSteps}
                />
              )}
              {showPriorities && <PrioritiesStep step={step} totalSteps={totalSteps} />}
              {showOverview && <OverviewStep step={step} totalSteps={totalSteps} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {generateError && <p className="text-app-red mt-5 text-center text-sm">{generateError}</p>}
      </div>

      <div className="relative shrink-0 border-t border-white/75 bg-white/86 px-6 pt-3 pb-6 backdrop-blur-sm">
        {isFinalStep ? (
          <>
            <Button
              variant="brand"
              fullWidth
              onClick={handleGenerate}
              disabled={!canAdvance() || isGenerating}
              className="shadow-brand-xl gap-2 rounded-[24px] py-5 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating trip...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate My Trip
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            variant="brand"
            fullWidth
            onClick={goNext}
            disabled={!canAdvance()}
            className="shadow-brand-xl gap-3 rounded-[24px] py-5 text-lg"
          >
            <span>{showPriorities ? "Analyze My Profile" : "Continue"}</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </Button>
        )}
      </div>
    </div>
  );
}
