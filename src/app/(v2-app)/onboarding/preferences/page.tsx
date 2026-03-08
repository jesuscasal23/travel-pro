"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { useTripStore } from "@/stores/useTripStore";
import { travelStyles } from "@/data/travelStyles";
import { Check } from "lucide-react";
import type { TravelStyle } from "@/types";

export default function PreferencesPage() {
  const router = useRouter();
  const travelStyle = useTripStore((s) => s.travelStyle);
  const setTravelStyle = useTripStore((s) => s.setTravelStyle);

  return (
    <OnboardingShell
      progress={30}
      ctaLabel="CONTINUE"
      onCtaClick={() => router.push("/onboarding/interests")}
    >
      <h1 className="text-v2-navy text-2xl font-bold">What&apos;s your travel style?</h1>
      <p className="text-v2-text-muted mb-6 text-sm">This helps us tailor recommendations to you</p>

      <div className="space-y-3">
        {travelStyles.map((style) => {
          const isSelected = travelStyle === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => setTravelStyle(style.id as TravelStyle)}
              aria-pressed={isSelected}
              className={`relative w-full cursor-pointer rounded-2xl border p-5 text-left transition-all ${
                isSelected
                  ? "bg-v2-orange border-v2-orange text-white"
                  : "border-v2-border text-v2-navy bg-white"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{style.emoji}</span>
                <div>
                  <div className="text-lg font-bold">{style.label}</div>
                  <div className="text-sm opacity-80">{style.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
