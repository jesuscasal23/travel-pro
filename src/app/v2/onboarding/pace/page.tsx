"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { OnboardingShell } from "@/components/v2/OnboardingShell";

const paceOptions = [
  {
    id: "fast",
    title: "Fast Explorer",
    description:
      "Visit many places, packed itinerary. See as much as possible in each destination.",
  },
  {
    id: "balanced",
    title: "Balanced Traveler",
    description: "Mix of sightseeing and relaxation.",
  },
  {
    id: "slow",
    title: "Slow Traveler",
    description: "Deep experiences, immersive stays.",
  },
] as const;

export default function PacePage() {
  const router = useRouter();
  const [selectedPace, setSelectedPace] = useState<string | null>(null);

  return (
    <OnboardingShell
      progress={65}
      ctaLabel="CONTINUE"
      ctaVariant="dark"
      onCtaClick={() => router.push("/v2/onboarding/pain-points")}
    >
      <h1 className="text-v2-navy text-2xl font-bold">How do you like to travel?</h1>
      <p className="text-v2-text-muted mb-6 text-sm">Choose your preferred travel pace</p>

      <div className="space-y-3">
        {paceOptions.map((option) => {
          const isSelected = selectedPace === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedPace(option.id)}
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
              <div className="text-lg font-bold">{option.title}</div>
              <div className="text-sm opacity-80">{option.description}</div>
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
