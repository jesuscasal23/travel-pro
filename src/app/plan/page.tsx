"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
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
import { normalizeInterests } from "@/lib/profile/interests";
import { DestinationStep } from "./steps/DestinationStep";
import { ProfileStep } from "./steps/ProfileStep";
import { PrioritiesStep } from "./steps/PrioritiesStep";
import { OverviewStep } from "./steps/OverviewStep";
import type { CityStop, Itinerary } from "@/types";
import { validate, onboardingStep1Schema, destinationStepSchema } from "@/lib/forms/schemas";
import type { CityWithDays } from "@/lib/flights/types";

export default function PlanPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const hydratedProfileRef = useRef(false);
  const [direction, setDirection] = useState(1);
  const planPath = "/plan";
  const signupPath = `/signup?next=${encodeURIComponent(planPath)}`;
  const loginPath = `/login?next=${encodeURIComponent(planPath)}`;
  const requiresAuth = isAuthenticated === false;
  const authStatusLoading = isAuthenticated === null;

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
    planningPriority,
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
    if (nationality || homeAirport) return;

    useTripStore.setState({
      nationality: persistedProfile.nationality,
      homeAirport: persistedProfile.homeAirport,
      travelStyle: persistedProfile.travelStyle,
      interests: normalizeInterests(persistedProfile.interests),
      pace: persistedProfile.pace ?? "moderate",
    });
    hydratedProfileRef.current = true;
  }, [persistedProfile, nationality, homeAirport]);

  // Clamp persisted planStep to valid range
  const step = Math.min(Math.max(planStep, 1), totalSteps);

  // Which content to show based on step + profile completeness
  const showDestination = step === 1;
  const showDetails = needsProfileStep ? step === 2 : false;
  const showPriorities = needsProfileStep ? step === 3 : step === 2;
  const showOverview = needsProfileStep ? step === 4 : step === 3;
  const isFinalStep = step === totalSteps;
  const progress = Math.round((step / totalSteps) * 100);

  // Speculative route selection: prefetch when user reaches destination step.
  useEffect(() => {
    if (isSingleCity || !dateStart || !dateEnd) return;
    if (step < 1) return;
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
      return hasDestination && !!dateStart && !!dateEnd && dayCount > 0;
    }
    if (showDetails) {
      return !!effectiveNationality && !!effectiveHomeAirport;
    }
    if (showPriorities) {
      return !!planningPriority;
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
    if (isAuthenticated !== true) {
      router.push(signupPath);
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
      const combinedDescription = [
        tripDescription.trim(),
        planningPriority ? `Primary challenge: ${planningPriority}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")
        .trim();

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
        ...(combinedDescription ? { description: combinedDescription } : {}),
      });

      setItinerary(buildPartialItinerary(route));
      setCurrentTripId(trip.id);
      posthog?.capture("itinerary_generation_started", { trip_id: trip.id, region });
      router.push(`/trips/${trip.id}`);
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
    planningPriority,
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
    signupPath,
    toast,
  ]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[linear-gradient(180deg,#f9fbff_0%,#ffffff_18%,#f6f8fb_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[radial-gradient(circle_at_top,#2563ff14_0%,transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,#1b2b4b10_0%,transparent_60%)]" />
      <ProgressBar progress={progress} />

      <div className="relative flex-1 overflow-y-auto px-6 pt-5 pb-4">
        <div className="mb-4 flex items-center">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/92 text-[#8aa0c0] shadow-[0_12px_30px_rgba(27,43,75,0.08)] backdrop-blur-sm transition-colors hover:text-[#1b2b4b] ${
              step === 1 ? "pointer-events-none opacity-0" : ""
            }`}
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

        {createTripMutation.error && (
          <p className="text-v2-red mt-5 text-center text-sm">
            {createTripMutation.error.message || "Something went wrong. Please try again."}
          </p>
        )}
      </div>

      <div className="relative shrink-0 border-t border-white/75 bg-white/86 px-6 pt-4 pb-8 backdrop-blur-sm">
        {isFinalStep ? (
          <>
            <Button
              variant="apple"
              onClick={() => (requiresAuth ? router.push(signupPath) : handleGenerate())}
              disabled={!canAdvance() || isGenerating || authStatusLoading}
              className="flex items-center justify-center gap-2 rounded-[24px] !bg-[#2563ff] py-5 text-lg font-bold shadow-[0_18px_36px_rgba(37,99,255,0.28)] hover:brightness-105"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating trip...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {authStatusLoading
                    ? "Checking account..."
                    : requiresAuth
                      ? "Create Account to Continue"
                      : "Continue to Generate My Trip"}
                </>
              )}
            </Button>
            {requiresAuth ? (
              <button
                type="button"
                onClick={() => router.push(loginPath)}
                className="mx-auto mt-3 block text-sm font-semibold text-[#6d7b91] transition-colors hover:text-[#1b2b4b]"
              >
                Already have an account? Sign in
              </button>
            ) : null}
          </>
        ) : (
          <Button
            variant="apple"
            onClick={goNext}
            disabled={!canAdvance()}
            className="flex items-center justify-center gap-3 rounded-[24px] !bg-[#101114] py-5 text-lg font-bold shadow-[0_18px_36px_rgba(16,17,20,0.22)]"
          >
            <span>{showPriorities ? "Analyze My Profile" : "Continue"}</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </Button>
        )}
      </div>
    </div>
  );
}
