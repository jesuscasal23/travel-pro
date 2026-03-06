"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTripStore } from "@/stores/useTripStore";
import { regions, interestOptions } from "@/data/sampleData";
import { nationalities } from "@/data/nationalities";
import { Badge, Button, FormField, SelectionCard } from "@/components/ui";
import { Navbar } from "@/components/Navbar";
import { StepProgress } from "@/components/ui/StepProgress";
import { inputClass } from "@/components/auth/auth-styles";
import {
  useAuthStatus,
  usePrefetchRouteSelection,
  useFetchRouteSelection,
  buildCacheKey,
  useCreateTrip,
} from "@/hooks/api";
import { slideVariants } from "@/lib/animations";
import { AirportCombobox } from "@/components/ui/AirportCombobox";
import { CityCombobox } from "@/components/ui/CityCombobox";
import { CountryCombobox } from "@/components/ui/CountryCombobox";
import { ChipGroup } from "@/components/ui/Chip";
import { TravelStylePicker } from "@/components/TravelStylePicker";
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
    // Onboarding fields
    nationality,
    setNationality,
    homeAirport,
    setHomeAirport,
    travelStyle,
    setTravelStyle,
    interests,
    toggleInterest,
    pace,
    setPace,
    // Plan fields
    tripType,
    setTripType,
    tripDescription,
    setTripDescription,
    region,
    setRegion,
    destination,
    destinationCountry,
    destinationCountryCode,
    destinationLat,
    destinationLng,
    setDestination,
    clearDestination,
    dateStart,
    setDateStart,
    dateEnd,
    setDateEnd,
    travelers,
    setTravelers,
    isGenerating,
    setIsGenerating,
    setCurrentTripId,
    setItinerary,
  } = useTripStore();

  // Treat as guest unless auth explicitly confirmed — null (loading) defaults to guest
  // so profile steps aren't skipped. Also show profile steps for authenticated users
  // who haven't completed core profile fields required by generation.
  const hasCoreProfile = Boolean(nationality && homeAirport);
  const isGuest = isAuthenticated !== true || !hasCoreProfile;

  const prefetchRoute = usePrefetchRouteSelection();
  const fetchRoute = useFetchRouteSelection();
  const createTripMutation = useCreateTrip();

  const [isListening, setIsListening] = useState(false);

  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    type SpeechRecognitionCtor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult:
        | ((event: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void)
        | null;
      start: () => void;
    };
    const SpeechRecognition: SpeechRecognitionCtor | undefined =
      ((window as Record<string, unknown>)["SpeechRecognition"] as
        | SpeechRecognitionCtor
        | undefined) ||
      ((window as Record<string, unknown>)["webkitSpeechRecognition"] as
        | SpeechRecognitionCtor
        | undefined);
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTripDescription(
        tripDescription.trim() ? `${tripDescription.trim()} ${transcript}` : transcript
      );
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  }, [isListening, tripDescription, setTripDescription]);

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
  // Step 3 (guest) / Step 2 (auth): nationality + airport + special requests merged
  const showProfileAndDescription = isGuest ? step === 3 : step === 2;

  // Speculative route selection: prefetch when user reaches destination step.
  useEffect(() => {
    if (isSingleCity || !dateStart || !dateEnd) return;
    if (!showDestination) return;
    // single-country needs destinationCountry; multi-country needs region
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
    if (showStyle) return true; // style has default, interests optional
    if (showProfileAndDescription) return !!nationality; // nationality required, rest optional
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
    },
    [dayCount]
  );

  // ── Helper: build single-city route from store destination fields ──────────
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

  // ── Helper: build partial itinerary from route (Strategy B) ────────────────
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

    // ── Get cities
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
      // Trip creation failed — button will re-enable
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
              {/* Guest Step 2 — Travel style */}
              {showStyle && (
                <div>
                  <h2 className="text-foreground text-2xl font-bold">Your travel style</h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Help us personalise every trip we plan for you.
                  </p>

                  <div className="mt-8 space-y-8">
                    <FormField label="Travel Style">
                      <TravelStylePicker value={travelStyle} onChange={setTravelStyle} compact />
                    </FormField>
                    <FormField label="Trip Pace">
                      <div className="bg-secondary flex gap-0 rounded-xl p-1">
                        {(
                          [
                            { value: "relaxed", label: "Relaxed", sub: "1–2 activities/day" },
                            { value: "moderate", label: "Balanced", sub: "3–4 activities/day" },
                            { value: "active", label: "Active", sub: "5+ activities/day" },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setPace(opt.value)}
                            className={`flex-1 rounded-lg px-3 py-2.5 text-center transition-all ${
                              pace === opt.value
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="text-sm font-medium">{opt.label}</div>
                            <div className="mt-0.5 text-xs opacity-70">{opt.sub}</div>
                          </button>
                        ))}
                      </div>
                    </FormField>
                    <FormField label="Interests">
                      <ChipGroup
                        options={interestOptions}
                        selected={interests}
                        onToggle={toggleInterest}
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Step 3 (guest) / Step 2 (auth) — About you + any special requests */}
              {showProfileAndDescription && (
                <div>
                  <h2 className="text-foreground text-2xl font-bold">A bit about you</h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Help us personalise visa checks, flights, and your itinerary.
                  </p>

                  <div className="mt-8 space-y-5">
                    <FormField label="Nationality" error={errors.nationality}>
                      <select
                        value={nationality}
                        onChange={(e) => {
                          setNationality(e.target.value);
                          clearError("nationality");
                        }}
                        className={inputClass}
                      >
                        <option value="">Select nationality</option>
                        {nationalities.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Home Airport" error={errors.homeAirport}>
                      <AirportCombobox
                        value={homeAirport}
                        onChange={(v) => {
                          setHomeAirport(v);
                          clearError("homeAirport");
                        }}
                      />
                    </FormField>
                  </div>

                  <div className="mt-8">
                    <label className="text-foreground mb-2 block text-sm font-medium">
                      Any special requests?{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <textarea
                        value={tripDescription}
                        onChange={(e) => setTripDescription(e.target.value)}
                        placeholder="e.g. We love street food and slow mornings. Prefer off-the-beaten-path spots over tourist traps. One of us has a shellfish allergy."
                        rows={4}
                        maxLength={2000}
                        className={`${inputClass} resize-none pr-10`}
                      />
                      <button
                        type="button"
                        onClick={toggleVoice}
                        className={`absolute right-2.5 bottom-2.5 rounded-full p-1.5 transition-all ${
                          isListening
                            ? "bg-accent animate-pulse text-white"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        }`}
                        title={isListening ? "Stop listening" : "Speak your request"}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                    </div>
                    {tripDescription.length > 1800 && (
                      <p className="text-muted-foreground mt-1 text-right text-xs">
                        {2000 - tripDescription.length} characters remaining
                      </p>
                    )}
                    <p className="text-muted-foreground mt-3 mb-2 text-xs">Quick add:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Street food lover 🍜",
                        "Off the beaten path 🥾",
                        "Shellfish allergy 🚫",
                        "Slow mornings ☕",
                        "Kid-friendly 👶",
                        "Vegetarian 🥗",
                      ].map((hint) => (
                        <button
                          key={hint}
                          type="button"
                          onClick={() =>
                            setTripDescription(
                              tripDescription.trim() ? `${tripDescription.trim()} ${hint}` : hint
                            )
                          }
                          className="border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground cursor-pointer rounded-full border px-3 py-1 text-xs transition-all"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Destination — Where & when? */}
              {showDestination && (
                <div>
                  <h2 className="text-foreground mb-1 text-2xl font-bold">Where & when?</h2>
                  <p className="text-muted-foreground mb-6">
                    Pick your destination and travel dates.
                  </p>

                  {/* Trip type toggle */}
                  <div className="bg-secondary mb-6 flex gap-0 rounded-xl p-1">
                    {(
                      [
                        { value: "single-city", label: "One City" },
                        { value: "single-country", label: "One Country" },
                        { value: "multi-city", label: "Region" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setTripType(opt.value);
                          setRegion("");
                          clearDestination();
                        }}
                        className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                          tripType === opt.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
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
                        onChange={(entry) => {
                          setDestination(
                            entry.city,
                            entry.country,
                            entry.countryCode,
                            entry.lat,
                            entry.lng
                          );
                          clearError("destination");
                        }}
                      />
                    </FormField>
                  ) : isSingleCountry ? (
                    <FormField label="Country" className="mb-6" error={errors.destinationCountry}>
                      <CountryCombobox
                        value={destinationCountry}
                        onChange={(entry) => {
                          setDestination(
                            "",
                            entry.country,
                            entry.countryCode,
                            entry.lat,
                            entry.lng
                          );
                          clearError("destinationCountry");
                        }}
                      />
                    </FormField>
                  ) : (
                    <div className="mb-6 grid grid-cols-2 gap-2">
                      {regions.map((r) => (
                        <SelectionCard
                          key={r.id}
                          selected={region === r.id}
                          onClick={() => {
                            setRegion(r.id);
                            clearError("region");
                          }}
                          className="!p-3"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="text-foreground text-sm font-semibold">{r.name}</div>
                            {r.popular && (
                              <Badge variant="info" className="shrink-0 text-[10px]">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground mt-0.5 text-xs leading-snug">
                            {r.countries}
                          </div>
                        </SelectionCard>
                      ))}
                      {errors.region && (
                        <p className="text-sm text-red-500 dark:text-red-400">{errors.region}</p>
                      )}
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Start date" error={errors.dateStart}>
                      <input
                        type="date"
                        value={dateStart}
                        onChange={(e) => {
                          setDateStart(e.target.value);
                          clearError("dateStart");
                        }}
                        className={inputClass}
                      />
                    </FormField>
                    <FormField label="End date" error={errors.dateEnd}>
                      <input
                        type="date"
                        value={dateEnd}
                        onChange={(e) => {
                          setDateEnd(e.target.value);
                          clearError("dateEnd");
                        }}
                        min={dateStart}
                        className={inputClass}
                      />
                    </FormField>
                  </div>

                  {/* Travelers */}
                  <div className="border-border bg-background mt-4 flex items-center justify-between rounded-xl border px-4 py-3">
                    <span className="text-foreground text-sm font-medium">Travelers</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTravelers(Math.max(1, travelers - 1))}
                        className="border-border text-foreground hover:border-primary hover:bg-primary/5 flex h-8 w-8 items-center justify-center rounded-full border text-lg font-bold transition-all"
                      >
                        −
                      </button>
                      <span className="text-primary w-6 text-center text-lg font-bold">
                        {travelers}
                      </span>
                      <button
                        onClick={() => setTravelers(Math.min(10, travelers + 1))}
                        className="border-border text-foreground hover:border-primary hover:bg-primary/5 flex h-8 w-8 items-center justify-center rounded-full border text-lg font-bold transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
