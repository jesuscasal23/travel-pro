"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { useTripStore } from "@/stores/useTripStore";
import { interestOptions } from "@/data/v2-mock-data";

export default function InterestsPage() {
  const router = useRouter();
  const interests = useTripStore((s) => s.interests);
  const toggleInterest = useTripStore((s) => s.toggleInterest);

  return (
    <OnboardingShell
      progress={45}
      ctaLabel="CONTINUE"
      onCtaClick={() => router.push("/onboarding/pace")}
    >
      <h1 className="text-v2-navy text-2xl font-bold">What interests you?</h1>
      <p className="text-v2-text-muted mb-8 text-sm">Select all that apply</p>

      <div className="grid grid-cols-2 gap-3">
        {interestOptions.map((interest) => {
          const isSelected = interests.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                isSelected
                  ? "bg-v2-orange border-v2-orange text-white"
                  : "bg-v2-chip-bg text-v2-navy border-transparent"
              }`}
            >
              {interest}
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
