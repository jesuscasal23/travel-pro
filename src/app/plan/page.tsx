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

export default function PlanPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const [direction, setDirection] = useState(1);
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
    tripDescription, setTripDescription,
    region, setRegion,
    destination, destinationCountry, destinationCountryCode,
    destinationLat, destinationLng,
    setDestination, clearDestination,
    dateStart, setDateStart,
    dateEnd, setDateEnd,
    travelers, setTravelers,
    isGenerating, setIsGenerating,
    setCurrentTripId, setItinerary,
  } = useTripStore();

  // Treat as guest unless auth explicitly confirmed — null (loading) defaults to guest
  // so profile steps aren't skipped. Also show profile steps for authenticated users
  // who haven't completed core profile fields required by generation.
  const hasCoreProfile = Boolean(nationality && homeAirport);
  const isGuest = isAuthenticated !== true || !hasCoreProfile;

  const prefetchRoute = usePrefetchRouteSelection();
  const fetchRoute = useFetchRouteSelection();
  const createTripMutation = useCreateTrip();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (field: string) => setErrors(prev => { const { [field]: _, ...rest } = prev; return rest; });

  const isSingleCity = tripType === "single-city";
  const isSingleCountry = tripType === "single-country";
  const isMultiCountry = tripType === "multi-city";
  const needsRouteReview = isSingleCountry || isMultiCountry;
  const totalSteps = isGuest
    ? (isSingleCity ? 4 : 5)
    : (isSingleCity ? 2 : 3);

  // Clamp persisted planStep to valid range
  const step = Math.min(Math.max(planStep, 1), totalSteps);

  // Which content to show based on step + auth
  const showProfile = isGuest && step === 1;
  const showStyle = isGuest && step === 2;
  const showDescription = isGuest ? step === 3 : step === 1;
  const showDestination = isGuest ? step === 4 : step === 2;
  const showRouteReview = needsRouteReview && step === totalSteps;

  // ── Speculative route selection: prefetch when user reaches destination step ──
  useEffect(() => {
    if (!needsRouteReview || !dateStart || !dateEnd) return;
    if (!showDestination) return;
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
        dateStart, dateEnd,
        travelers,
      },
    };
    prefetchRoute(params, cacheKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDestination, needsRouteReview, isSingleCountry, isMultiCountry, region, destinationCountry, dateStart, dateEnd, travelStyle]);

  const dayCount = (() => {
    if (!dateStart || !dateEnd) return 0;
    return Math.max(0, Math.round((new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / 86400000));
  })();

  const canAdvance = () => {
    if (showProfile) return !!nationality;
    if (showStyle) return true; // style has default, interests optional
    if (showDescription) return true; // always optional
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

  const goNext = async () => {
    if (showProfile) {
      const fieldErrors = validate(onboardingStep1Schema, { nationality, homeAirport });
      if (fieldErrors) { setErrors(fieldErrors); return; }
    }
    if (showDestination) {
      const fieldErrors = validate(destinationStepSchema, { tripType, region, destination, destinationCountry, dateStart, dateEnd });
      if (fieldErrors) { setErrors(fieldErrors); return; }
      const detailErrors = validate(detailsStepSchema, { travelers });
      if (detailErrors) { setErrors(detailErrors); return; }
    }
    setErrors({});
    setDirection(1);
    setPlanStep(step + 1);

    // If advancing to route review, fetch the AI-suggested route
    if (showDestination && needsRouteReview) {
      setRouteLoading(true);
      const cacheKey = buildCacheKey({ region, destinationCountry, dateStart, dateEnd, travelStyle });
      const params = {
        profile: { nationality, homeAirport, travelStyle, interests },
        tripIntent: {
          id: "speculative",
          tripType, region,
          destinationCountry, destinationCountryCode,
          dateStart, dateEnd, travelers,
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
  }), []);

  const handleGenerate = useCallback(async (routeFromReview?: CityStop[]) => {
    // Only validate if not coming from route review (already validated on advance)
    if (!routeFromReview) {
      const fieldErrors = validate(destinationStepSchema, { tripType, region, destination, destinationCountry, dateStart, dateEnd });
      if (fieldErrors) { setErrors(fieldErrors); return; }
    }
    setErrors({});

    posthog?.capture("questionnaire_completed", {
      tripType, region, destination, duration_days: dayCount, travelers,
    });
    setIsGenerating(true);

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
          dateStart, dateEnd, travelers,
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
        dateStart, dateEnd, travelers,
        ...(tripDescription.trim() ? { description: tripDescription.trim() } : {}),
      });

      setItinerary(buildPartialItinerary(route));
      setCurrentTripId(trip.id);
      posthog?.capture("itinerary_generation_started", { trip_id: trip.id, region });
      setIsGenerating(false);
      router.push(`/trip/${trip.id}`);
    } catch {
      // Trip creation failed — button will re-enable
      setIsGenerating(false);
    }
  }, [
    isSingleCity, isSingleCountry, isMultiCountry,
    tripType, region, tripDescription, destination, destinationCountry, destinationCountryCode,
    dateStart, dateEnd, travelers,
    dayCount, nationality, homeAirport, travelStyle, interests,
    setIsGenerating, setCurrentTripId, setItinerary,
    citiesToRoute, singleCityRoute, buildPartialItinerary,
    fetchRoute, createTripMutation,
    router, posthog,
  ]);

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

              {/* Step 3 (guest) / Step 1 (auth) — Any special requests? */}
              {showDescription && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Any special requests?</h2>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Optional — tell us what kind of trip you want. Pace, priorities, things to avoid.
                  </p>

                  <div className="mt-8">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Your notes <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={tripDescription}
                      onChange={(e) => setTripDescription(e.target.value)}
                      placeholder="e.g. We love street food and slow mornings. Prefer off-the-beaten-path spots over tourist traps. One of us has a shellfish allergy."
                      rows={5}
                      maxLength={2000}
                      className={`${inputClass} resize-none`}
                    />
                    {tripDescription.length > 1800 && (
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {2000 - tripDescription.length} characters remaining
                      </p>
                    )}
                  </div>

                  <div className="mt-6 bg-primary/5 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Tip:</span> Mentions of pace, food preferences, must-avoids, or experience types all help Claude personalise your itinerary.
                    </p>
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
                  </div>

                  {/* Travelers */}
                  <div className="mt-8">
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
              <Button onClick={() => handleGenerate()} disabled={!canAdvance()} loading={isGenerating} className="gap-2">
                <Sparkles className="w-4 h-4" />
                {isGenerating ? "Creating trip..." : "Generate My Itinerary"}
              </Button>
            )
          )}
        </div>

        {createTripMutation.error && (
          <p className="mt-4 text-sm text-accent text-center">
            {createTripMutation.error.message || "Something went wrong. Please try again."}
          </p>
        )}
      </div>
    </div>
  );
}
