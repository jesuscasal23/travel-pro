"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button, ChipGroup, FormField } from "@/components/ui";
import { useTripStore } from "@/stores/useTripStore";
import { interestOptions } from "@/data/sampleData";
import { nationalities } from "@/data/nationalities";
import { AirportCombobox } from "@/components/ui/AirportCombobox";
import { TravelStylePicker } from "@/components/TravelStylePicker";
import { StepProgress } from "@/components/ui/StepProgress";
import { inputClass } from "@/components/auth/auth-styles";
import { slideVariants } from "@/lib/animations";

const TOTAL_STEPS = 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const {
    nationality,
    homeAirport,
    travelStyle,
    interests,
    setNationality,
    setHomeAirport,
    setTravelStyle,
    toggleInterest,
    setDisplayName,
    displayName,
  } = useTripStore();

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
    router.push("/plan");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={false} />

      <div className="max-w-lg mx-auto px-4 pt-24 pb-12">
        {/* Progress */}
        <StepProgress step={step} totalSteps={TOTAL_STEPS} />

        {/* Step content */}
        <div className="overflow-x-clip overflow-y-visible relative -mx-1 px-1">
          <AnimatePresence mode="wait" custom={direction}>

            {/* Step 1 — Where are you from? */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }}>
                <h1 className="text-2xl font-bold text-foreground">Where are you from?</h1>
                <p className="mt-2 text-muted-foreground text-sm">This helps us check visa requirements and find the best flights.</p>

                <div className="mt-8 space-y-5">
                  <FormField label="Your name">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="First name"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Nationality">
                    <select value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputClass}>
                      {nationalities.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Home Airport">
                    <AirportCombobox value={homeAirport} onChange={setHomeAirport} />
                  </FormField>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Travel preferences */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }}>
                <h1 className="text-2xl font-bold text-foreground">Your travel style</h1>
                <p className="mt-2 text-muted-foreground text-sm">Help us personalise every trip we plan for you.</p>

                <div className="mt-8 space-y-8">
                  <FormField label="Travel Style">
                    <TravelStylePicker value={travelStyle} onChange={setTravelStyle} />
                  </FormField>

                  <FormField label="Interests">
                    <ChipGroup options={interestOptions} selected={interests} onToggle={toggleInterest} />
                  </FormField>
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
              className={`flex items-center gap-1 text-sm text-muted-foreground transition-opacity ${step === 1 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <Button
              onClick={goNext}
              loading={isSaving}
              className="gap-2"
            >
              {step === TOTAL_STEPS ? (
                <>Start Planning <Check className="w-4 h-4" /></>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
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
