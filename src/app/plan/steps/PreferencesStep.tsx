"use client";

import { useTripStore } from "@/stores/useTripStore";
import { InterestSelector } from "@/components/profile/InterestSelector";
import { PaceSelector } from "@/components/profile/PaceSelector";
import { TripDescriptionCard } from "./TripDescriptionCard";

interface PreferencesStepProps {
  includeTripDescription?: boolean;
}

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
        <PaceSelector value={pace} onChange={setPace} />
      </section>

      <section>
        <p className="text-v2-text-muted mb-3 text-xs font-bold tracking-[0.22em] uppercase">
          Interests
        </p>
        <InterestSelector selected={interests} onToggle={toggleInterest} />
      </section>

      {includeTripDescription && <TripDescriptionCard compact />}
    </div>
  );
}
