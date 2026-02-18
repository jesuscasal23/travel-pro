"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
import { regions } from "@/data/sampleData";
import { Badge } from "@/components/ui";
import { Navbar } from "@/components/Navbar";
import type { TripVibe } from "@/types";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const generationSteps = [
  { emoji: "🧭", label: "Generating your route..." },
  { emoji: "📅", label: "Planning daily activities..." },
  { emoji: "🛂", label: "Checking visa requirements..." },
  { emoji: "🌤️", label: "Analyzing weather patterns..." },
  { emoji: "💰", label: "Calculating your budget..." },
  { emoji: "✅", label: "Your trip is ready!" },
];

const vibes = [
  { id: "relaxation", emoji: "🧘", label: "Relaxation", description: "Beaches, spas, slow mornings" },
  { id: "adventure", emoji: "🧗", label: "Adventure", description: "Hiking, diving, thrill-seeking" },
  { id: "cultural", emoji: "🏛️", label: "Cultural", description: "Museums, temples, local traditions" },
  { id: "mix", emoji: "🎯", label: "Mix of everything", description: "A balanced blend of all styles" },
] as const;

export default function PlanPage() {
  const router = useRouter();
  const {
    planStep, setPlanStep,
    region, setRegion,
    dateStart, setDateStart,
    dateEnd, setDateEnd,
    flexibleDates, setFlexibleDates,
    budget, setBudget,
    vibe, setVibe,
    travelers, setTravelers,
    isGenerating, setIsGenerating,
    generationStep, setGenerationStep,
  } = useTripStore();

  // Advance generation steps and navigate when done
  useEffect(() => {
    if (!isGenerating) return;
    if (generationStep >= 5) {
      const timeout = setTimeout(() => {
        router.push("/trip/japan-vietnam-thailand-2026");
      }, 600);
      return () => clearTimeout(timeout);
    }
    const interval = setInterval(() => {
      setGenerationStep(generationStep + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, [isGenerating, generationStep, setGenerationStep, router]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationStep(0);
  };

  const dayCount = (() => {
    if (!dateStart || !dateEnd) return 0;
    const diff = new Date(dateEnd).getTime() - new Date(dateStart).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  })();

  const canAdvance = () => {
    switch (planStep) {
      case 1: return !!region;
      case 2: return !!dateStart && !!dateEnd && dayCount > 0;
      case 3: return budget > 0;
      case 4: return !!vibe;
      case 5: return travelers > 0;
      default: return true;
    }
  };

  // Generation loading screen
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-foreground">Creating your itinerary</h2>
            <p className="text-muted-foreground mt-2">This usually takes about 30 seconds</p>
          </motion.div>

          <div className="space-y-4">
            {generationSteps.map((gs, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: i <= generationStep ? 1 : 0.3,
                  x: 0,
                }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-all duration-300
                    ${i < generationStep
                      ? "bg-primary/10"
                      : i === generationStep
                      ? "bg-primary/20 animate-pulse"
                      : "bg-secondary"
                    }`}
                >
                  {gs.emoji}
                </div>
                <span className="font-medium text-foreground flex-1">{gs.label}</span>
                {i < generationStep && (
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      <div className="max-w-xl mx-auto px-4 pt-24 pb-12">
        {/* 6 dot progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`h-2.5 rounded-full transition-all duration-300
                ${s === planStep ? "bg-primary w-8" : s < planStep ? "bg-primary w-2.5" : "bg-border w-2.5"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={planStep}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Card 1 — Where do you want to go? */}
            {planStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Where do you want to go?</h2>
                <p className="text-muted-foreground mb-6">Choose your destination region to get started.</p>
                <div className="space-y-3">
                  {regions.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRegion(r.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200
                        ${region === r.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
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
              </div>
            )}

            {/* Card 2 — How long is your trip? */}
            {planStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">How long is your trip?</h2>
                <p className="text-muted-foreground mb-6">Select your travel dates.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Start date
                    </label>
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      End date
                    </label>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      min={dateStart}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    />
                  </div>
                  {dayCount > 0 && (
                    <div className="bg-primary/5 rounded-lg p-4 text-center">
                      <span className="text-primary font-semibold text-lg">{dayCount} days</span>
                      <span className="text-muted-foreground text-sm ml-2">total trip duration</span>
                    </div>
                  )}
                  {/* Flexible dates toggle */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      role="switch"
                      aria-checked={flexibleDates}
                      onClick={() => setFlexibleDates(!flexibleDates)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer
                        ${flexibleDates ? "bg-primary" : "bg-border"}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
                          ${flexibleDates ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </div>
                    <span className="text-sm text-foreground">My dates are flexible (±3 days)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Card 3 — What's your budget? */}
            {planStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">What&apos;s your budget?</h2>
                <p className="text-muted-foreground mb-6">Per person, for the entire trip.</p>
                <div className="text-center mb-8">
                  <span className="text-4xl font-bold text-primary">€{budget.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={30000}
                  step={500}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>€1,000</span>
                  <span>€30,000</span>
                </div>
              </div>
            )}

            {/* Card 4 — What's the vibe? */}
            {planStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">What&apos;s the vibe?</h2>
                <p className="text-muted-foreground mb-6">How do you like to travel?</p>
                <div className="grid grid-cols-2 gap-3">
                  {vibes.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVibe(v.id as TripVibe)}
                      className={`p-5 rounded-xl border-2 text-left transition-all duration-200
                        ${vibe === v.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="text-2xl">{v.emoji}</div>
                      <div className="font-semibold text-sm mt-2 text-foreground">{v.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{v.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Card 5 — How many travelers? */}
            {planStep === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">How many travelers?</h2>
                <p className="text-muted-foreground mb-12">Including yourself.</p>
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={() => setTravelers(Math.max(1, travelers - 1))}
                    className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all text-2xl font-bold text-foreground"
                  >
                    −
                  </button>
                  <span className="text-5xl font-bold text-primary w-16 text-center">{travelers}</span>
                  <button
                    onClick={() => setTravelers(Math.min(10, travelers + 1))}
                    className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all text-2xl font-bold text-foreground"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Card 6 — Trip Summary */}
            {planStep === 6 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Your trip summary</h2>
                <p className="text-muted-foreground mb-6">Review your choices before we generate your itinerary.</p>
                <div className="card-travel bg-background mb-6">
                  {[
                    { label: "Region", value: regions.find((r) => r.id === region)?.name || region || "Not set" },
                    {
                      label: "Dates",
                      value: dateStart && dateEnd
                        ? `${dateStart} → ${dateEnd} (${dayCount} days)`
                        : "Not set",
                    },
                    { label: "Budget", value: `€${budget.toLocaleString()} per person` },
                    { label: "Vibe", value: vibes.find((v) => v.id === vibe)?.label || vibe },
                    { label: "Travelers", value: `${travelers} traveler${travelers !== 1 ? "s" : ""}` },
                  ].map((row, i, arr) => (
                    <div
                      key={row.label}
                      className={`flex justify-between py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}
                    >
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground text-right ml-4">{row.value}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleGenerate}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate My Itinerary
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation — shown for steps 1–5 */}
        {planStep < 6 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setPlanStep(Math.max(1, planStep - 1))}
              className={`flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors
                ${planStep === 1 ? "opacity-0 pointer-events-none" : ""}`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setPlanStep(planStep + 1)}
              disabled={!canAdvance()}
              className="btn-primary text-sm py-2 px-5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Skip for now — step 1 only */}
        {planStep === 1 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setPlanStep(2)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
