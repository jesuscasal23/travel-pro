"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { interestOptions } from "@/data/v2-mock-data";

export default function InterestsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(interest: string) {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  return (
    <OnboardingShell
      progress={35}
      ctaLabel="CONTINUE"
      onCtaClick={() => router.push("/v2/onboarding/budget")}
    >
      <h1 className="text-v2-navy text-2xl font-bold">What interests you?</h1>
      <p className="text-v2-text-muted mb-8 text-sm">Select all that apply</p>

      <div className="grid grid-cols-2 gap-3">
        {interestOptions.map((interest) => {
          const isSelected = selected.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggle(interest)}
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
