"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, UserPlus } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTripStore } from "@/stores/useTripStore";
import { usePlanFormStore } from "@/stores/usePlanFormStore";
import { useToastStore } from "@/stores/useToastStore";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { useAuthStatus, useProfile, useCreateTrip, useSaveProfile } from "@/hooks/api";
import { queryKeys } from "@/hooks/api/keys";
import { slideVariants } from "@/lib/animations";
import { normalizeInterests } from "@/lib/features/profile/interests";
import { DestinationStep } from "./steps/DestinationStep";
import { ProfileStep } from "./steps/ProfileStep";
import { PrioritiesStep } from "./steps/PrioritiesStep";
import { OverviewStep } from "./steps/OverviewStep";
import { SignupGateStep } from "./steps/SignupGateStep";
import type { CityStop } from "@/types";
import { validate, onboardingStep1Schema, destinationStepSchema } from "@/lib/forms/schemas";
import { daysBetween } from "@/lib/utils/format/date";
import Link from "next/link";

export default function PlanPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStatus();
  const hydratedProfileRef = useRef(false);
  const [direction, setDirection] = useState(1);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Plan form fields — persisted across navigation and signup redirect
  const {
    planStep,
    setPlanStep,
    selectedCities,
    tripDescription,
    planningPriorities,
    dateStart,
    dateEnd,
    travelers,
  } = usePlanFormStore();

  // Profile fields and generation UI state — transient
  const {
    nationality,
    homeAirport,
    travelStyle,
    interests,
    pace,
    vibes,
    isGenerating,
    setIsGenerating,
  } = useTripStore();

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

  const effectiveNationality = nationality || persistedProfile?.nationality || "";
  const effectiveHomeAirport = homeAirport || persistedProfile?.homeAirport || "";
  const hasCoreProfile = Boolean(effectiveNationality && effectiveHomeAirport);
  const canSkipProfileStep = isAuthenticated === true && hasCoreProfile;
  const needsProfileStep = !canSkipProfileStep;
  const needsPrioritiesStep = needsProfileStep; // only during onboarding
  const totalSteps = needsProfileStep ? 4 : 1;

  useEffect(() => {
    if (hydratedProfileRef.current || !persistedProfile) return;
    if (!persistedProfile.nationality || !persistedProfile.homeAirport) return;

    useTripStore.setState({
      nationality: persistedProfile.nationality,
      homeAirport: persistedProfile.homeAirport,
      travelStyle: persistedProfile.travelStyle,
      interests: normalizeInterests(persistedProfile.interests),
      pace: persistedProfile.pace ?? "moderate",
      vibes: persistedProfile.vibes ?? null,
    });
    hydratedProfileRef.current = true;
  }, [persistedProfile]);

  // Clamp persisted planStep to valid range
  const step = Math.min(Math.max(planStep, 1), totalSteps);

  // Which content to show based on step + profile completeness
  const showDetails = needsProfileStep ? step === 1 : false;
  const showDestination = needsProfileStep ? step === 2 : step === 1;
  const showPriorities = needsPrioritiesStep && step === 3;
  const showOverview = needsProfileStep ? step === 4 : false;
  const isFinalStep = step === totalSteps;
  const showSignupGate = isFinalStep && isAuthenticated === false;
  const progress = Math.round((step / totalSteps) * 100);

  const dayCount = dateStart && dateEnd ? Math.max(0, daysBetween(dateStart, dateEnd)) : 0;

  const canAdvance = () => {
    if (showDestination) {
      return selectedCities.length > 0 && !!dateStart && !!dateEnd && dayCount > 0;
    }
    if (showDetails) {
      return !!effectiveNationality && !!effectiveHomeAirport;
    }
    if (showPriorities) {
      return planningPriorities.length > 0;
    }
    return true;
  };

  const goNext = () => {
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
    if (showDestination) {
      const fieldErrors = validate(destinationStepSchema, { selectedCities, dateStart, dateEnd });
      if (fieldErrors) {
        setErrors(fieldErrors);
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

  const prioritySummary =
    planningPriorities.length === 0
      ? ""
      : planningPriorities.length === 1
        ? `Primary challenge: ${planningPriorities[0]}`
        : `Top challenges: ${planningPriorities.join(", ")}`;

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

    const fieldErrors = validate(destinationStepSchema, { selectedCities, dateStart, dateEnd });
    if (fieldErrors) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setGenerateError(null);

    const tripType = selectedCities.length === 1 ? "single-city" : "multi-city";
    const firstCity = selectedCities[0];

    posthog?.capture("questionnaire_completed", {
      tripType,
      cityCount: selectedCities.length,
      cities: selectedCities.map((c) => c.city),
      duration_days: dayCount,
      travelers,
    });
    setIsGenerating(true);

    // Build initial route — even distribution of days across cities
    const perCity = dayCount > 0 ? Math.floor(dayCount / selectedCities.length) : 1;
    const route: CityStop[] = selectedCities.map((c, i) => ({
      id: c.city.toLowerCase().replace(/\s+/g, "-"),
      city: c.city,
      country: c.country,
      countryCode: c.countryCode,
      lat: c.lat,
      lng: c.lng,
      iataCode: c.iataCode,
      days:
        i === selectedCities.length - 1
          ? Math.max(1, dayCount - perCity * (selectedCities.length - 1))
          : Math.max(1, perCity),
    }));

    const combinedDescription = [tripDescription.trim(), prioritySummary]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (isAuthenticated === true) {
      try {
        await saveProfileMutation.mutateAsync({
          nationality: effectiveNationality,
          homeAirport: effectiveHomeAirport,
          travelStyle: travelStyle ?? undefined,
          interests,
          pace: pace ?? undefined,
          vibes: vibes ?? undefined,
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
        region: "",
        ...(firstCity
          ? {
              destination: firstCity.city,
              destinationCountry: firstCity.country,
              destinationCountryCode: firstCity.countryCode,
            }
          : {}),
        dateStart,
        dateEnd,
        travelers,
        ...(combinedDescription ? { description: combinedDescription } : {}),
        initialItinerary: { route, days: [] },
      });

      // Prime React Query cache so TripClientProvider renders immediately on navigation
      queryClient.setQueryData(queryKeys.trips.detail(trip.id), trip);
      posthog?.capture("itinerary_build_started", {
        trip_id: trip.id,
        city_count: selectedCities.length,
      });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setIsGenerating(false);
      setGenerateError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }, [
    needsProfileStep,
    selectedCities,
    tripDescription,
    planningPriorities,
    prioritySummary,
    dateStart,
    dateEnd,
    travelers,
    dayCount,
    effectiveNationality,
    effectiveHomeAirport,
    travelStyle,
    interests,
    setIsGenerating,
    pace,
    vibes,
    saveProfileMutation,
    createTripMutation,
    queryClient,
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
              {showDetails && (
                <ProfileStep
                  errors={errors}
                  clearError={clearError}
                  step={step}
                  totalSteps={totalSteps}
                />
              )}
              {showDestination && (
                <DestinationStep
                  errors={errors}
                  clearError={clearError}
                  step={step}
                  totalSteps={totalSteps}
                />
              )}
              {showPriorities && <PrioritiesStep step={step} totalSteps={totalSteps} />}
              {showOverview &&
                (showSignupGate ? (
                  <SignupGateStep />
                ) : (
                  <OverviewStep step={step} totalSteps={totalSteps} />
                ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {generateError && <p className="text-app-red mt-5 text-center text-sm">{generateError}</p>}
      </div>

      <div className="relative shrink-0 border-t border-white/75 bg-white/86 px-6 pt-3 pb-6 backdrop-blur-sm">
        {showSignupGate ? (
          <>
            <Button
              variant="brand"
              fullWidth
              onClick={() => router.push("/premium")}
              className="shadow-brand-xl gap-2 rounded-[24px] py-5 text-lg"
            >
              <UserPlus className="h-5 w-5" />
              Create free account
            </Button>
            <p className="text-dim mt-3 text-center text-sm">
              Already have an account?{" "}
              <Link
                href={`/login?next=${encodeURIComponent("/plan")}`}
                className="text-brand-primary font-semibold"
              >
                Log in
              </Link>
            </p>
          </>
        ) : isFinalStep ? (
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
