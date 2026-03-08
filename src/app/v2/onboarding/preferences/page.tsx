"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { SpectrumSlider } from "@/components/v2/ui/SpectrumSlider";

const sliderConfigs = [
  { leftLabel: "Adventure", rightLabel: "Comfort" },
  { leftLabel: "Social", rightLabel: "Quiet" },
  { leftLabel: "Luxury", rightLabel: "Budget" },
  { leftLabel: "Structured", rightLabel: "Spontaneous" },
  { leftLabel: "Warm Weather", rightLabel: "Mixed Climates" },
] as const;

export default function PreferencesPage() {
  const router = useRouter();
  const [values, setValues] = useState<number[]>([50, 50, 50, 50, 50]);

  const updateValue = (index: number, value: number) => {
    setValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  return (
    <OnboardingShell
      progress={20}
      ctaLabel="CONTINUE"
      onCtaClick={() => router.push("/v2/onboarding/interests")}
    >
      <div>
        <h1 className="text-v2-navy text-2xl font-bold">Tell us about you</h1>
        <p className="text-v2-text-muted mt-1 text-sm">Slide to share your travel preferences</p>

        <div className="mt-8 space-y-8">
          {sliderConfigs.map((config, index) => (
            <SpectrumSlider
              key={config.leftLabel}
              leftLabel={config.leftLabel}
              rightLabel={config.rightLabel}
              value={values[index]}
              onChange={(value) => updateValue(index, value)}
            />
          ))}
        </div>
      </div>
    </OnboardingShell>
  );
}
