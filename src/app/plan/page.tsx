"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTripStore } from "@/stores/useTripStore";
import { regions, interestOptions } from "@/data/sampleData";
import { nationalities } from "@/data/nationalities";
import { Badge, Button, FormField, SelectionCard } from "@/components/ui";
import { Navbar } from "@/components/Navbar";
import { StepProgress } from "@/components/ui/StepProgress";
import { inputClass } from "@/components/auth/auth-styles";
import { useAuthStatus, usePrefetchRouteSelection, useFetchRouteSelection, buildCacheKey, useCreateTrip } from "@/hooks/api";
import { slideVariants } from "@/lib/animations";
import { AirportCombobox } from "@/components/ui/AirportCombobox";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { CountryCombobox } from "@/components/ui/CountryCombobox";
import { ChipGroup } from "@/components/ui/Chip";
import { TravelStylePicker } from "@/components/TravelStylePicker";
import type { CityStop, Itinerary } from "@/types";
import { validate, onboardingStep1Schema, destinationStepSchema, detailsStepSchema } from "@/lib/validation/schemas";
import type { CityWithDays } from "@/lib/flights/types";
import { RouteReviewStep } from "@/components/plan/RouteReviewStep";

const multiCityGenerationSteps = [
  { stage: "route",      emoji: "🧭", label: "Optimising your route" },
  { stage: "activities", emoji: "📅", label: "Planning daily activities" },
  { stage: "done",       emoji: "✅", label: "Your trip is ready!" },
];

const singleCityGenerationSteps = [
  { stage: "activities", emoji: "🏘️", label: "Exploring neighborhoods" },
  { stage: "planning",   emoji: "📅", label: "Planning daily activities" },
  { stage: "done",       emoji: "✅", label: "Your trip is ready!" },
];

// TODO: Replace with verified facts (these are AI-generated placeholders)
const funFacts = [
  "Japan has over 6,800 islands, but most visitors only explore four of the main ones.",
  "Thailand's full ceremonial name is the longest country name in the world — 168 characters.",
  "Vietnam is home to the world's largest cave, Hang Son Doong, big enough to fit a 747.",
  "Iceland has no mosquitoes — one of the few inhabited places on Earth without them.",
  "New Zealand was the last major landmass to be settled by humans, around 1250 AD.",
  "Costa Rica has no army — it was abolished in 1948 and the budget goes to education.",
  "Bhutan measures its success by Gross National Happiness instead of GDP.",
  "The shortest commercial flight in the world is 57 seconds, between two Scottish islands.",
  "Colombia has the most public holidays of any country in the world — 18 per year.",
  "Finland has more saunas than cars — roughly 3.3 million saunas for 5.5 million people.",
];

export default function PlanPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const [direction, setDirection] = useState(1);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [funFactIndex, setFunFactIndex] = useState(0);

  const isGuest = isAuthenticated === false;
  const [routeCities, setRouteCities] = useState<CityStop[] | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const {
    planStep, setPlanStep,
    // Onboarding fields
    nationality, setNationality,
    homeAirport, setHomeAirport,
    travelStyle, setTravelStyle,
    interests, toggleInterest,
    // Plan fields
    tripType, setTripType,
    region, setRegion,
    destination, destinationCountry, destinationCountryCode,
    destinationLat, destinationLng,
    setDestination, clearDestination,
    dateStart, setDateStart,
    dateEnd, setDateEnd,
    flexibleDates, setFlexibleDates,
    budget, setBudget,
    travelers, setTravelers,
    isGenerating, setIsGenerating,
    generationStep, setGenerationStep,
    setCurrentTripId, setItinerary,
  } = useTripStore();

  const prefetchRoute = usePrefetchRouteSelection();
  const fetchRoute = useFetchRouteSelection();
  const createTripMutation = useCreateTrip();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (field: string) => setErrors(prev => { const { [field]: _, ...rest } = prev; return rest; });

  // Cycle fun facts during generation
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setFunFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const isSingleCity = tripType === "single-city";
  const isSingleCountry = tripType === "single-country";
  const isMultiCountry = tripType === "multi-city";
  const needsRouteReview = isSingleCountry || isMultiCountry;
  const totalSteps = isGuest
    ? (isSingleCity ? 4 : 5)
    : (isSingleCity ? 2 : 3);
  const generationSteps = isSingleCity ? singleCityGenerationSteps : multiCityGenerationSteps;

  // Clamp persisted planStep to valid range
  const step = Math.min(Math.max(planStep, 1), totalSteps);

  // Which content to show based on step + auth
  const showProfile = isGuest && step === 1;
  const showStyle = isGuest && step === 2;
  const showDestination = isGuest ? step === 3 : step === 1;
  const showDetails = isGuest ? step === 4 : step === 2;
  const showRouteReview = needsRouteReview && step === totalSteps;

  // ── Speculative route selection: prefetch when user reaches details step ────
  useEffect(() => {
    if (!needsRouteReview || !dateStart || !dateEnd) return;
    if (!showDetails) return;
    // single-country needs destinationCountry; multi-country needs region
    if (isSingleCountry && !destinationCountry) return;
    if (isMultiCountry && !region) return;

    const cacheKey = buildCacheKey({ region, destinationCountry, dateStart, dateEnd, travelStyle });
    const params = {
      profile: { nationality, homeAirport, travelStyle, interests },
      tripIntent: {
        id: "speculative",
        tripType, region,
        destinationCountry, destinationCountryCode,
        dateStart, dateEnd, flexibleDates,
        budget, travelers,
      },
    };
    prefetchRoute(params, cacheKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetails, needsRouteReview, isSingleCountry, isMultiCountry, region, destinationCountry, dateStart, dateEnd, travelStyle]);

  const dayCount = (() => {
    if (!dateStart || !dateEnd) return 0;
    return Math.max(0, Math.round((new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / 86400000));
  })();

  const canAdvance = () => {
    if (showProfile) return !!nationality;
    if (showStyle) return true; // style has default, interests optional
    if (showDestination) {
      const hasDestination = isSingleCity
        ? !!destination
        : isSingleCountry
        ? !!destinationCountry
        : !!region;
      return hasDestination && !!dateStart && !!dateEnd && dayCount > 0;
    }
    if (showDetails) return budget > 0 && travelers > 0;
    return true;
  };

  const goNext = async () => {
    if (showProfile) {
      const fieldErrors = validate(onboardingStep1Schema, { nationality, homeAirport });
      if (fieldErrors) { setErrors(fieldErrors); return; }
    }
    if (showDestination) {
      const fieldErrors = validate(destinationStepSchema, { tripType, region, destination, destinationCountry, dateStart, dateEnd });
      if (fieldErrors) { setErrors(fieldErrors); return; }
    }
    if (showDetails) {
      const fieldErrors = validate(detailsStepSchema, { budget, travelers });
      if (fieldErrors) { setErrors(fieldErrors); return; }
    }
    setErrors({});
    setDirection(1);
    setPlanStep(step + 1);

    // If advancing to route review, fetch the AI-suggested route
    if (showDetails && needsRouteReview) {
      setRouteLoading(true);
      const cacheKey = buildCacheKey({ region, destinationCountry, dateStart, dateEnd, travelStyle });
      const params = {
        profile: { nationality, homeAirport, travelStyle, interests },
        tripIntent: {
          id: "speculative",
          tripType, region,
          destinationCountry, destinationCountryCode,
          dateStart, dateEnd, flexibleDates, budget, travelers,
        },
      };
      try {
        const cities = await fetchRoute(params, cacheKey);
        if (cities && cities.length > 0) {
          setRouteCities(citiesToRoute(cities));
        }
      } catch {
        // Route selection failed — review step will show empty state
      }
      setRouteLoading(false);
    }
  };

  const goBack = () => {
    setErrors({});
    setDirection(-1);
    setPlanStep(step - 1);
  };

  // ── Helper: convert CityWithDays[] → CityStop[] for partial itinerary ────
  const citiesToRoute = useCallback((cities: CityWithDays[]): CityStop[] => {
    // Start with the average of min/max for each city
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

    // If total exceeds the trip duration, scale down proportionally
    const total = raw.reduce((s, c) => s + c.days, 0);
    if (dayCount > 0 && total > dayCount) {
      const scale = dayCount / total;
      let remaining = dayCount;
      for (let i = 0; i < raw.length; i++) {
        if (i === raw.length - 1) {
          // Last city gets whatever is left to avoid rounding drift
          raw[i].days = Math.max(1, remaining);
        } else {
          raw[i].days = Math.max(1, Math.round(raw[i].days * scale));
          remaining -= raw[i].days;
        }
      }
    }

    return raw;
  }, [dayCount]);

  // ── Helper: build single-city route from store destination fields ──────────
  const singleCityRoute = useCallback((): CityStop[] => {
    if (!destination) return [];
    return [{
      id: destination.toLowerCase().replace(/\s+/g, "-"),
      city: destination,
      country: destinationCountry,
      countryCode: destinationCountryCode,
      lat: destinationLat,
      lng: destinationLng,
      days: dayCount || 7,
    }];
  }, [destination, destinationCountry, destinationCountryCode, destinationLat, destinationLng, dayCount]);

  // ── Helper: build partial itinerary from route (Strategy B) ────────────────
  const buildPartialItinerary = useCallback((route: CityStop[]): Itinerary => ({
    route,
    days: [],
    budget: { flights: 0, accommodation: 0, activities: 0, food: 0, transport: 0, total: 0, budget },
  }), [budget]);

  const handleGenerate = useCallback(async (routeFromReview?: CityStop[]) => {
    // Only validate details if not coming from route review (already validated on advance)
    if (!routeFromReview) {
      const fieldErrors = validate(detailsStepSchema, { budget, travelers });
      if (fieldErrors) { setErrors(fieldErrors); return; }
    }
    setErrors({});

    posthog?.capture("questionnaire_completed", {
      tripType, region, destination, duration_days: dayCount, budget_eur: budget, travelers,
    });
    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationError(null);

    // ── Get cities
    let route: CityStop[] = [];

    if (routeFromReview) {
      // Multi-city from route review — use the user-edited cities
      route = routeFromReview;
    } else if (isSingleCity) {
      route = singleCityRoute();
    } else {
      // Fallback for multi-city/single-country without route review
      const cacheKey = buildCacheKey({ region, destinationCountry, dateStart, dateEnd, travelStyle });
      const params = {
        profile: { nationality, homeAirport, travelStyle, interests },
        tripIntent: {
          id: "speculative",
          tripType, region,
          destinationCountry, destinationCountryCode,
          dateStart, dateEnd, flexibleDates, budget, travelers,
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

    // ── Create trip record (works for both auth and anonymous users) ──────────
    try {
      const { trip } = await createTripMutation.mutateAsync({
        tripType,
        region: isMultiCountry ? region : "",
        ...(isSingleCity
          ? { destination, destinationCountry, destinationCountryCode }
          : isSingleCountry
          ? { destinationCountry, destinationCountryCode }
          : {}),
        dateStart, dateEnd, flexibleDates, budget, travelers,
      });

      setItinerary(buildPartialItinerary(route));
      setCurrentTripId(trip.id);
      posthog?.capture("itinerary_generation_started", { trip_id: trip.id, region });
      setIsGenerating(false);
      router.push(`/trip/${trip.id}`);
    } catch {
      // Trip creation failed
      setIsGenerating(false);
      setGenerationError("Something went wrong. Please try again.");
    }
  }, [
    isSingleCity, isSingleCountry, isMultiCountry,
    tripType, region, destination, destinationCountry, destinationCountryCode,
    dateStart, dateEnd, flexibleDates, budget, travelers,
    dayCount, nationality, homeAirport, travelStyle, interests,
    setIsGenerating, setGenerationStep, setCurrentTripId, setItinerary,
    citiesToRoute, singleCityRoute, buildPartialItinerary,
    fetchRoute, createTripMutation,
    router, posthog,
  ]);

  // Generation loading screen
  if (isGenerating || generationError) {
    const displaySteps = generationSteps.slice(0, -1); // exclude "done"
    const progressPercent = Math.min(100, Math.round((generationStep / displaySteps.length) * 100));
    const currentStepNum = Math.min(generationStep + 1, displaySteps.length);
    const remainingSeconds = Math.max(0, (displaySteps.length - generationStep) * 6);

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full px-4">

          {/* Animated globe with orbiting airplane */}
          {!generationError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-[120px] h-[120px] mx-auto mb-8"
            >
              {/* Outer dashed ring */}
              <motion.div
                className="absolute -inset-2.5 border-2 border-dashed border-border rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />
              {/* Inner spinning ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-[3px] border-border border-t-primary"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              {/* Globe emoji */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center text-5xl"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                🌏
              </motion.div>
              {/* Airplane orbit */}
              <motion.div
                className="absolute -inset-[18px]"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-lg">✈️</span>
              </motion.div>
            </motion.div>
          )}

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-foreground">
              {generationError ? "Generation failed" : "Creating your itinerary"}
            </h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {generationError ? generationError : "Crafting the perfect trip just for you"}
            </p>
          </motion.div>

          {/* Progress bar */}
          {!generationError && (
            <div className="mb-8">
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-primary to-teal-400"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Step {currentStepNum} of {displaySteps.length}</span>
                <span>~{remainingSeconds}s remaining</span>
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            {displaySteps.map((gs, i) => {
              const isErrorStep = !!(generationError && i === generationStep);
              const isCompleted = i < generationStep && !isErrorStep;
              const isActive = i === generationStep && !generationError;
              const isPending = i > generationStep;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300
                    ${isErrorStep ? "bg-accent/10 ring-1 ring-accent/30" : ""}
                    ${isCompleted ? "bg-primary/[0.06]" : ""}
                    ${isActive ? "bg-primary/10 shadow-[0_0_0_1px_rgba(13,115,119,0.2)]" : ""}
                  `}
                >
                  <motion.div
                    className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-xl shrink-0 transition-all duration-300
                      ${isErrorStep ? "bg-accent/20" : ""}
                      ${isCompleted ? "bg-primary/10" : ""}
                      ${isActive ? "bg-primary" : ""}
                      ${isPending ? "bg-secondary" : ""}
                    `}
                    animate={isActive ? {
                      boxShadow: [
                        "0 0 0 0 rgba(13,115,119,0.3)",
                        "0 0 0 8px rgba(13,115,119,0)",
                        "0 0 0 0 rgba(13,115,119,0.3)",
                      ],
                    } : {}}
                    transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                  >
                    {isErrorStep ? "❌" : gs.emoji}
                  </motion.div>

                  <span className={`font-medium text-sm flex-1 text-left
                    ${isErrorStep ? "text-accent" : isPending ? "text-muted-foreground" : "text-foreground"}
                  `}>
                    {isErrorStep ? "Generation failed" : gs.label}
                  </span>

                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5">
                        <polyline points="3.5 8 6.5 11 12.5 5" />
                      </svg>
                    </motion.div>
                  )}

                  {isActive && (
                    <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Fun fact */}
          {!generationError && (
            <div className="mt-9 p-4 bg-secondary rounded-xl text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1.5">
                Did you know?
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={funFactIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-[13px] text-muted-foreground leading-relaxed"
                >
                  {funFacts[funFactIndex]}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Error actions */}
          {generationError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col items-center gap-3"
            >
              <Button onClick={() => handleGenerate()} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setGenerationError(null); setIsGenerating(false); }}
              >
                Back to questionnaire
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={isAuthenticated ?? false} />

      <div className="max-w-xl mx-auto px-4 pt-24 pb-12">
        {/* Progress */}
        <StepProgress step={step} totalSteps={totalSteps} />

        <div className="overflow-x-clip overflow-y-visible relative -mx-1 px-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">

              {/* Guest Step 1 — Where are you from? */}
              {showProfile && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Where are you from?</h2>
                  <p className="mt-2 text-muted-foreground text-sm">This helps us check visa requirements and find the best flights.</p>

                  <div className="mt-8 space-y-5">
                    <FormField label="Nationality" error={errors.nationality}>
                      <select value={nationality} onChange={(e) => { setNationality(e.target.value); clearError("nationality"); }} className={inputClass}>
                        <option value="">Select nationality</option>
                        {nationalities.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Home Airport" error={errors.homeAirport}>
                      <AirportCombobox value={homeAirport} onChange={(v) => { setHomeAirport(v); clearError("homeAirport"); }} />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Guest Step 2 — Travel style */}
              {showStyle && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Your travel style</h2>
                  <p className="mt-2 text-muted-foreground text-sm">Help us personalise every trip we plan for you.</p>

                  <div className="mt-8 space-y-8">
                    <FormField label="Travel Style">
                      <TravelStylePicker value={travelStyle} onChange={setTravelStyle} />
                    </FormField>
                    <FormField label="Interests">
                      <ChipGroup options={interestOptions} selected={interests} onToggle={toggleInterest} />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Destination — Where & when? */}
              {showDestination && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Where & when?</h2>
                  <p className="text-muted-foreground mb-6">Pick your destination and travel dates.</p>

                  {/* Trip type toggle */}
                  <div className="flex gap-0 p-1 bg-secondary rounded-xl mb-6">
                    {([
                      { value: "single-city", label: "One City" },
                      { value: "single-country", label: "One Country" },
                      { value: "multi-city", label: "Multi-Country" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setTripType(opt.value);
                          setRegion("");
                          clearDestination();
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                          tripType === opt.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Destination input */}
                  {isSingleCity ? (
                    <FormField label="City" className="mb-6" error={errors.destination}>
                      <CityCombobox
                        value={destination ? `${destination}, ${destinationCountry}` : ""}
                        onChange={(entry) => { setDestination(entry.city, entry.country, entry.countryCode, entry.lat, entry.lng); clearError("destination"); }}
                      />
                    </FormField>
                  ) : isSingleCountry ? (
                    <FormField label="Country" className="mb-6" error={errors.destinationCountry}>
                      <CountryCombobox
                        value={destinationCountry}
                        onChange={(entry) => { setDestination("", entry.country, entry.countryCode, entry.lat, entry.lng); clearError("destinationCountry"); }}
                      />
                    </FormField>
                  ) : (
                    <div className="space-y-3 mb-6">
                      {regions.map((r) => (
                        <SelectionCard key={r.id} selected={region === r.id} onClick={() => { setRegion(r.id); clearError("region"); }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-foreground">{r.name}</div>
                              <div className="text-sm text-muted-foreground mt-0.5">{r.countries}</div>
                            </div>
                            {r.popular && <Badge variant="info">Popular</Badge>}
                          </div>
                        </SelectionCard>
                      ))}
                      {errors.region && <p className="text-sm text-red-500 dark:text-red-400">{errors.region}</p>}
                    </div>
                  )}

                  {/* Dates */}
                  <div className="space-y-4">
                    <FormField label="Start date" error={errors.dateStart}>
                      <input type="date" value={dateStart} onChange={(e) => { setDateStart(e.target.value); clearError("dateStart"); }}
                        className={inputClass} />
                    </FormField>
                    <FormField label="End date" error={errors.dateEnd}>
                      <input type="date" value={dateEnd} onChange={(e) => { setDateEnd(e.target.value); clearError("dateEnd"); }} min={dateStart}
                        className={inputClass} />
                    </FormField>
                    {dayCount > 0 && (
                      <div className="bg-primary/5 rounded-lg p-3 text-center">
                        <span className="text-primary font-semibold">{dayCount} days</span>
                        <span className="text-muted-foreground text-sm ml-2">total trip duration</span>
                      </div>
                    )}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <button type="button" role="switch" aria-checked={flexibleDates} onClick={() => setFlexibleDates(!flexibleDates)}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${flexibleDates ? "bg-primary" : "bg-border"}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform duration-200 ${flexibleDates ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                      <span className="text-sm text-foreground">My dates are flexible (±3 days)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Trip details — Budget & Travelers */}
              {showDetails && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Trip details</h2>
                  <p className="text-muted-foreground mb-8">A few quick choices and we&apos;re ready to plan.</p>

                  <div className="space-y-8">
                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-4">
                        Budget <span className="text-muted-foreground font-normal">— per person, entire trip</span>
                      </label>
                      <div className="text-center mb-4">
                        <span className="text-4xl font-bold text-primary">€{budget.toLocaleString()}</span>
                      </div>
                      <input type="range" min={1000} max={30000} step={500} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full accent-primary cursor-pointer" />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2"><span>€1,000</span><span>€30,000</span></div>
                    </div>

                    {/* Travelers */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-4">Travelers</label>
                      <div className="flex items-center justify-center gap-8">
                        <button onClick={() => setTravelers(Math.max(1, travelers - 1))}
                          className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all text-2xl font-bold text-foreground">−</button>
                        <span className="text-5xl font-bold text-primary w-16 text-center">{travelers}</span>
                        <button onClick={() => setTravelers(Math.min(10, travelers + 1))}
                          className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all text-2xl font-bold text-foreground">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Route review — single-country & multi-country */}
              {showRouteReview && (
                <RouteReviewStep
                  cities={routeCities ?? []}
                  tripDuration={dayCount}
                  onConfirm={handleGenerate}
                  isLoading={routeLoading}
                />
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button onClick={goBack}
            className={`flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {showRouteReview ? null : (
            step < totalSteps ? (
              <Button onClick={goNext} disabled={!canAdvance()} size="sm" className="gap-1.5">
                Continue
              </Button>
            ) : (
              <Button onClick={() => handleGenerate()} disabled={!canAdvance()} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate My Itinerary
              </Button>
            )
          )}
        </div>

        {generationError && (
          <p className="mt-4 text-sm text-accent text-center">{generationError}</p>
        )}
      </div>
    </div>
  );
}
