"use client";

import { useTripStore } from "@/stores/useTripStore";
import { interestOptions } from "@/data/sampleData";
import type { ActivityPace } from "@/types";
import { TripDescriptionCard } from "./TripDescriptionCard";

interface PreferencesStepProps {
  includeTripDescription?: boolean;
}

const paceOptions: { id: ActivityPace; title: string; description: string }[] = [
  { id: "relaxed", title: "Relaxed", description: "Fewer things, more breathing room." },
  { id: "moderate", title: "Balanced", description: "A healthy mix of movement and downtime." },
  { id: "active", title: "Active", description: "Pack the days and see as much as possible." },
];

export function PreferencesStep({ includeTripDescription = false }: PreferencesStepProps) {
  const pace = useTripStore((s) => s.pace);
  const setPace = useTripStore((s) => s.setPace);
  const interests = useTripStore((s) => s.interests);
  const toggleInterest = useTripStore((s) => s.toggleInterest);

  return (
    <div className="space-y-6 pb-2">
      <div>
        <h2 className="text-v2-navy text-[28px] leading-tight font-bold">
          What should fill the trip?
        </h2>
        <p className="text-v2-text-muted mt-2 text-sm">
          Set the pace and the types of experiences you want Travel Pro to prioritize.
        </p>
      </div>

      <section>
        <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-[0.22em] uppercase">
          Trip Pace
        </p>
        <div className="space-y-2.5">
          {paceOptions.map((option) => {
            const isSelected = pace === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setPace(option.id)}
                aria-pressed={isSelected}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? "bg-v2-orange border-v2-orange text-white"
                    : "border-v2-border text-v2-navy bg-white"
                }`}
              >
                <div className="text-sm font-bold">{option.title}</div>
                <p className="mt-1 text-xs leading-relaxed opacity-80">{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-[0.22em] uppercase">
          Interests
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {interestOptions.map((interest) => {
            const isSelected = interests.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                aria-pressed={isSelected}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-v2-orange border-v2-orange text-white"
                    : "bg-v2-chip-bg text-v2-navy border-transparent"
                }`}
              >
                <span className="mr-2">{interest.emoji}</span>
                {interest.label}
              </button>
            );
          })}
        </div>
      </section>

      {includeTripDescription && <TripDescriptionCard compact />}
    </div>
  );
}
