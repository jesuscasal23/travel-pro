"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ChipGroup } from "@/components/ui/Chip";
import { useTripStore } from "@/stores/useTripStore";
import { nationalities, interestOptions } from "@/data/sampleData";
import { AirportCombobox } from "@/components/ui/AirportCombobox";
import type { TravelStyle } from "@/types";

const TOTAL_STEPS = 2;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const travelStyles: { id: TravelStyle; emoji: string; label: string; description: string }[] = [
  { id: "backpacker", emoji: "🎒", label: "Backpacker", description: "Hostels, street food, maximum adventure" },
  { id: "comfort", emoji: "🛏️", label: "Comfort", description: "3–4 star hotels, mix of local and known restaurants" },
  { id: "luxury", emoji: "✨", label: "Luxury", description: "5-star properties, fine dining, premium experiences" },
];

const activityLevels = [
  { id: "low", label: "Low", description: "Relaxed pace — 1–2 activities per day, plenty of downtime" },
  { id: "moderate", label: "Moderate", description: "Mix of activity and rest — 3–4 things per day" },
  { id: "high", label: "High", description: "Packed schedule — early starts, every moment counts" },
];

const languages = [
  "English", "German", "French", "Spanish", "Italian", "Portuguese",
  "Dutch", "Polish", "Swedish", "Norwegian", "Danish", "Finnish",
  "Japanese", "Mandarin", "Korean", "Arabic", "Russian", "Turkish",
  "Hindi", "Thai",
];

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
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

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="overflow-hidden relative -mx-1 px-1">
          <AnimatePresence mode="wait" custom={direction}>

            {/* Step 1 — Where are you from? */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }}>
                <h1 className="text-2xl font-bold text-foreground">Where are you from?</h1>
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
                      {nationalities.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Home Airport</label>
                    <AirportCombobox value={homeAirport} onChange={setHomeAirport} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Travel preferences */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }}>
                <h1 className="text-2xl font-bold text-foreground">Your travel style</h1>
                <p className="mt-2 text-muted-foreground text-sm">Help us personalise every trip we plan for you.</p>

                <div className="mt-8 space-y-8">
                  {/* Travel Style */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Travel Style</label>
                    <div className="space-y-3">
                      {travelStyles.map((style) => (
                        <button key={style.id} type="button" onClick={() => setTravelStyle(style.id)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${travelStyle === style.id ? "border-primary bg-primary/5" : "border-border bg-background hover:border-border/80"}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{style.emoji}</span>
                            <div>
                              <div className="font-semibold text-foreground text-sm">{style.label}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{style.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Activity Level</label>
                    <div className="space-y-3">
                      {activityLevels.map((level) => (
                        <button key={level.id} type="button" onClick={() => setActivityLevel(level.id)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${activityLevel === level.id ? "border-primary bg-primary/5" : "border-border bg-background hover:border-border/80"}`}>
                          <div className="font-semibold text-foreground text-sm">{level.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{level.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Interests</label>
                    <ChipGroup options={interestOptions} selected={interests} onToggle={toggleInterest} />
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Languages you speak{" "}
                      <span className="text-muted-foreground font-normal">(select all that apply)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang) => (
                        <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${selectedLanguages.includes(lang) ? "chip-selected border-transparent" : "chip border-transparent"}`}>
                          {lang}
                        </button>
                      ))}
                    </div>
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
              className={`flex items-center gap-1 text-sm text-muted-foreground transition-opacity ${step === 1 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              {step === TOTAL_STEPS ? (
                isSaving ? "Saving..." : (
                  <>Start Planning <Check className="w-4 h-4" /></>
                )
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
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
