"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, CheckCircle } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useTripStore } from "@/stores/useTripStore";
import { regions, interestOptions } from "@/data/sampleData";
import { nationalities } from "@/data/nationalities";
import { Badge } from "@/components/ui";
import { Navbar } from "@/components/Navbar";
import { StepProgress } from "@/components/ui/StepProgress";
import { inputClass } from "@/components/auth/auth-styles";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { slideVariants } from "@/lib/animations";
import { AirportCombobox } from "@/components/ui/AirportCombobox";
import { ChipGroup } from "@/components/ui/Chip";
import { TravelStylePicker } from "@/components/TravelStylePicker";
import type { TripVibe } from "@/types";

const generationSteps = [
  { stage: "route",      emoji: "🧭", label: "Optimising your route..." },
  { stage: "activities", emoji: "📅", label: "Planning daily activities..." },
  { stage: "visa",       emoji: "🛂", label: "Checking visa requirements..." },
  { stage: "weather",    emoji: "🌤️", label: "Analysing weather patterns..." },
  { stage: "budget",     emoji: "💰", label: "Calculating your budget..." },
  { stage: "done",       emoji: "✅", label: "Your trip is ready!" },
];

const vibes = [
  { id: "relaxation", emoji: "🧘", label: "Relaxation", description: "Beaches, spas, slow mornings" },
  { id: "adventure",  emoji: "🧗", label: "Adventure",  description: "Hiking, diving, thrill-seeking" },
  { id: "cultural",   emoji: "🏛️", label: "Cultural",   description: "Museums, temples, local traditions" },
  { id: "mix",        emoji: "🎯", label: "Mix of everything", description: "A balanced blend of all styles" },
] as const;

export default function PlanPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const [direction, setDirection] = useState(1);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const isGuest = isAuthenticated === false;
  const totalSteps = isGuest ? 4 : 2;

  const {
    planStep, setPlanStep,
    // Onboarding fields
    displayName, setDisplayName,
    nationality, setNationality,
    homeAirport, setHomeAirport,
    travelStyle, setTravelStyle,
    interests, toggleInterest,
    // Plan fields
    region, setRegion,
    dateStart, setDateStart,
    dateEnd, setDateEnd,
    flexibleDates, setFlexibleDates,
    budget, setBudget,
    vibe, setVibe,
    travelers, setTravelers,
    isGenerating, setIsGenerating,
    generationStep, setGenerationStep,
    setCurrentTripId, setItinerary,
  } = useTripStore();

  // Clamp persisted planStep to valid range
  const step = Math.min(Math.max(planStep, 1), totalSteps);

  // Which content to show based on step + auth
  const showProfile = isGuest && step === 1;
  const showStyle = isGuest && step === 2;
  const showDestination = isGuest ? step === 3 : step === 1;
  const showDetails = isGuest ? step === 4 : step === 2;

  const dayCount = (() => {
    if (!dateStart || !dateEnd) return 0;
    return Math.max(0, Math.round((new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / 86400000));
  })();

  const canAdvance = () => {
    if (showProfile) return !!displayName.trim() && !!nationality;
    if (showStyle) return true; // style has default, interests optional
    if (showDestination) return !!region && !!dateStart && !!dateEnd && dayCount > 0;
    if (showDetails) return budget > 0 && !!vibe && travelers > 0;
    return true;
  };

  const goNext = () => {
    setDirection(1);
    setPlanStep(step + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setPlanStep(step - 1);
  };

  const handleGenerate = useCallback(async () => {
    posthog?.capture("questionnaire_completed", {
      region, duration_days: dayCount, budget_eur: budget, vibe, travelers,
    });
    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationError(null);

    // ── Guest mode: no DB, call /api/generate directly ──────────
    if (!isAuthenticated) {
      const stepDelays = [3000, 7000, 12000, 17000, 22000];
      const timers = stepDelays.map((delay, i) =>
        setTimeout(() => setGenerationStep(i + 1), delay)
      );

      try {
        const genRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: { nationality, homeAirport, travelStyle, interests },
            tripIntent: { id: "guest", region, dateStart, dateEnd, flexibleDates, budget, vibe, travelers },
          }),
        });

        timers.forEach(clearTimeout);
        setGenerationStep(5);

        if (genRes.ok) {
          const { itinerary } = await genRes.json();
          setItinerary(itinerary);
          setTimeout(() => router.push("/trip/guest"), 600);
        } else {
          setGenerationError("We couldn't generate your itinerary. Please try again.");
          setIsGenerating(false);
        }
      } catch {
        timers.forEach(clearTimeout);
        setGenerationError("Something went wrong. Please try again.");
        setIsGenerating(false);
      }
      return;
    }

    // ── Authenticated mode: DB-backed with SSE progress ─────────
    try {
      const tripRes = await fetch("/api/v1/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, dateStart, dateEnd, flexibleDates, budget, vibe, travelers }),
      });

      let tripId: string | null = null;
      if (tripRes.ok) {
        const { trip } = await tripRes.json();
        tripId = trip.id;
        setCurrentTripId(tripId ?? "");
      }

      if (tripId) {
        posthog?.capture("itinerary_generation_started", { trip_id: tripId, region });
        const genRes = await fetch(`/api/v1/trips/${tripId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: { nationality, homeAirport, travelStyle, interests },
            promptVersion: "v1",
          }),
        });

        if (genRes.ok && genRes.body) {
          const reader = genRes.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split("\n");

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const event = JSON.parse(line.slice(6));
                const idx = generationSteps.findIndex((s) => s.stage === event.stage);
                if (idx >= 0) setGenerationStep(idx);

                if (event.stage === "done") {
                  posthog?.capture("itinerary_generation_completed", { trip_id: event.trip_id });
                  if (event.trip_id) {
                    const tripData = await fetch(`/api/v1/trips/${event.trip_id}`).then((r) => r.json());
                    setItinerary(tripData.trip?.itineraries?.[0]?.data ?? null);
                    router.push(`/trip/${event.itinerary_id ?? event.trip_id}`);
                  }
                  return;
                }
              } catch {
                // Ignore malformed SSE lines
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("[plan] Generation failed:", err);
    }

    // Total failure — send user back to dashboard
    router.push("/dashboard");
  }, [
    isAuthenticated,
    region, dateStart, dateEnd, flexibleDates, budget, vibe, travelers,
    dayCount, nationality, homeAirport, travelStyle, interests,
    setIsGenerating, setGenerationStep, setCurrentTripId, setItinerary, router, posthog,
  ]);

  // Generation loading screen
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">Creating your itinerary</h2>
            <p className="text-muted-foreground mt-2">This usually takes about 30 seconds</p>
          </motion.div>

          <div className="space-y-4">
            {generationSteps.map((gs, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: i <= generationStep ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 transition-all duration-300
                    ${i < generationStep ? "bg-primary/10" : i === generationStep ? "bg-primary/20 animate-pulse" : "bg-secondary"}`}
                >
                  {gs.emoji}
                </div>
                <span className="font-medium text-foreground flex-1">{gs.label}</span>
                {i < generationStep && <CheckCircle className="w-5 h-5 text-primary shrink-0" />}
              </motion.div>
            ))}
          </div>
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
            <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>

              {/* Guest Step 1 — Where are you from? */}
              {showProfile && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Where are you from?</h2>
                  <p className="mt-2 text-muted-foreground text-sm">This helps us check visa requirements and find the best flights.</p>

                  <div className="mt-8 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Your name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="First name"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nationality</label>
                      <select value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputClass}>
                        <option value="">Select nationality</option>
                        {nationalities.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Home Airport</label>
                      <AirportCombobox value={homeAirport} onChange={setHomeAirport} />
                    </div>
                  </div>
                </div>
              )}

              {/* Guest Step 2 — Travel style */}
              {showStyle && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Your travel style</h2>
                  <p className="mt-2 text-muted-foreground text-sm">Help us personalise every trip we plan for you.</p>

                  <div className="mt-8 space-y-8">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Travel Style</label>
                      <TravelStylePicker value={travelStyle} onChange={setTravelStyle} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Interests</label>
                      <ChipGroup options={interestOptions} selected={interests} onToggle={toggleInterest} />
                    </div>
                  </div>
                </div>
              )}

              {/* Destination — Where & when? */}
              {showDestination && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Where & when?</h2>
                  <p className="text-muted-foreground mb-6">Pick your destination and travel dates.</p>

                  {/* Region */}
                  <div className="space-y-3 mb-6">
                    {regions.map((r) => (
                      <button key={r.id} onClick={() => setRegion(r.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${region === r.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-foreground">{r.name}</div>
                            <div className="text-sm text-muted-foreground mt-0.5">{r.countries}</div>
                          </div>
                          {r.popular && <Badge variant="info">Popular</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Dates */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Start date</label>
                      <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">End date</label>
                      <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} min={dateStart}
                        className={inputClass} />
                    </div>
                    {dayCount > 0 && (
                      <div className="bg-primary/5 rounded-lg p-3 text-center">
                        <span className="text-primary font-semibold">{dayCount} days</span>
                        <span className="text-muted-foreground text-sm ml-2">total trip duration</span>
                      </div>
                    )}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div role="switch" aria-checked={flexibleDates} onClick={() => setFlexibleDates(!flexibleDates)}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${flexibleDates ? "bg-primary" : "bg-border"}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${flexibleDates ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                      <span className="text-sm text-foreground">My dates are flexible (±3 days)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Trip details — Budget, Vibe, Travelers */}
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

                    {/* Vibe */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">Vibe</label>
                      <div className="grid grid-cols-2 gap-3">
                        {vibes.map((v) => (
                          <button key={v.id} onClick={() => setVibe(v.id as TripVibe)}
                            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${vibe === v.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                            <div className="text-xl">{v.emoji}</div>
                            <div className="font-semibold text-sm mt-1.5 text-foreground">{v.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{v.description}</div>
                          </button>
                        ))}
                      </div>
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

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button onClick={goBack}
            className={`flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < totalSteps ? (
            <button onClick={goNext} disabled={!canAdvance()}
              className="btn-primary text-sm py-2 px-5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              Continue
            </button>
          ) : (
            <button onClick={handleGenerate} disabled={!canAdvance()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Sparkles className="w-4 h-4" />
              Generate My Itinerary
            </button>
          )}
        </div>

        {generationError && (
          <p className="mt-4 text-sm text-accent text-center">{generationError}</p>
        )}
      </div>
    </div>
  );
}
