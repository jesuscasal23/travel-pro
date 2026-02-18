"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ChipGroup } from "@/components/ui/Chip";
import { useTripStore } from "@/stores/useTripStore";
import { airports, nationalities, interestOptions } from "@/data/sampleData";
import type { TravelStyle } from "@/types";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const travelStyles: {
  id: TravelStyle;
  emoji: string;
  label: string;
  description: string;
}[] = [
  {
    id: "backpacker",
    emoji: "🎒",
    label: "Backpacker",
    description: "Hostels, street food, maximum adventure",
  },
  {
    id: "comfort",
    emoji: "🛏️",
    label: "Comfort",
    description: "3–4 star hotels, mix of local and known restaurants",
  },
  {
    id: "luxury",
    emoji: "✨",
    label: "Luxury",
    description: "5-star properties, fine dining, premium experiences",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const {
    nationality,
    homeAirport,
    travelStyle,
    interests,
    setNationality,
    setHomeAirport,
    setTravelStyle,
    toggleInterest,
  } = useTripStore();

  const goNext = () => {
    if (step === 1) {
      setDirection(1);
      setStep(2);
    } else {
      router.push("/plan");
    }
  };

  const goBack = () => {
    if (step === 2) {
      setDirection(-1);
      setStep(1);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={false} />

      <div className="max-w-lg mx-auto px-4 pt-24 pb-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of 2
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${(step / 2) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="overflow-hidden relative">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 ? (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <h1 className="text-2xl font-bold text-foreground">
                  Where are you from?
                </h1>
                <p className="mt-2 text-muted-foreground text-sm">
                  This helps us check visa requirements and find the best
                  flights.
                </p>

                <div className="mt-8 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nationality
                    </label>
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className={inputClass}
                    >
                      {nationalities.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Home Airport
                    </label>
                    <select
                      value={homeAirport}
                      onChange={(e) => setHomeAirport(e.target.value)}
                      className={inputClass}
                    >
                      {airports.map((a) => (
                        <option key={a.code} value={a.label}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <h1 className="text-2xl font-bold text-foreground">
                  Tell us about yourself
                </h1>
                <p className="mt-2 text-muted-foreground text-sm">
                  Your travel style and interests help us personalize your
                  trips.
                </p>

                <div className="mt-8 space-y-6">
                  {/* Travel Style */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Travel Style
                    </label>
                    <div className="space-y-3">
                      {travelStyles.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setTravelStyle(style.id)}
                          className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                            travelStyle === style.id
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:border-border/80"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{style.emoji}</span>
                            <div>
                              <div className="font-semibold text-foreground">
                                {style.label}
                              </div>
                              <div className="text-sm text-muted-foreground mt-0.5">
                                {style.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Interests
                    </label>
                    <ChipGroup
                      options={interestOptions}
                      selected={interests}
                      onToggle={toggleInterest}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-10 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className={`flex items-center gap-1 text-sm text-muted-foreground transition-opacity ${
                step === 1 ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              type="button"
              onClick={goNext}
              className="btn-primary flex items-center gap-2"
            >
              {step === 2 ? "Get Started" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {step === 1 && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/plan")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
