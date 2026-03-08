"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { painPointOptions } from "@/data/v2-mock-data";

export default function PainPointsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(option: string) {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  return (
    <OnboardingShell
      progress={75}
      ctaLabel="START PLANNING"
      onCtaClick={() => router.push("/onboarding/summary")}
    >
      <h1 className="text-v2-navy text-2xl font-bold">
        What&apos;s the hardest part of planning trips?
      </h1>
      <p className="text-v2-text-muted mb-8 text-sm">We built this app to solve exactly this</p>

      <div className="space-y-3">
        {painPointOptions.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`w-fit cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                isSelected
                  ? "bg-v2-orange border-v2-orange text-white"
                  : "bg-v2-chip-bg text-v2-navy border-transparent"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
