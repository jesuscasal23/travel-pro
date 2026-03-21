"use client";

import { travelStyles } from "@/data/travelStyles";
import { regions } from "@/data/sampleData";
import { useTripStore } from "@/stores/useTripStore";
import { StepBadge } from "./StepBadge";

interface OverviewStepProps {
  step: number;
  totalSteps: number;
}

export function OverviewStep({ step, totalSteps }: OverviewStepProps) {
  const tripType = useTripStore((s) => s.tripType);
  const region = useTripStore((s) => s.region);
  const destination = useTripStore((s) => s.destination);
  const destinationCountry = useTripStore((s) => s.destinationCountry);
  const travelStyle = useTripStore((s) => s.travelStyle);
  const interests = useTripStore((s) => s.interests);
  const pace = useTripStore((s) => s.pace);

  const regionLabel = regions.find((item) => item.id === region)?.name ?? region;
  const destinationLabel =
    tripType === "multi-city"
      ? regionLabel
      : tripType === "single-country"
        ? destinationCountry
        : destination;
  const budgetLabel =
    travelStyles.find((style) => style.id === travelStyle)?.label ?? "Smart Budget";
  const paceLabel =
    pace === "active" ? "The Sprinter" : pace === "relaxed" ? "The Soul Searcher" : "The Wanderer";

  return (
    <div className="space-y-5 pb-2 text-center">
      <div className="flex items-start justify-between gap-4 text-left">
        <div className="min-w-0 flex-1">
          <p className="font-display text-app-green text-[11px] font-bold tracking-[0.34em] uppercase">
            Profile Complete
          </p>
          <h2 className="text-navy mt-3 text-[30px] leading-[1.06] font-bold tracking-[-0.05em]">
            Your Travel DNA is ready
          </h2>
          <p className="text-dim mt-2 text-sm">We&apos;ve captured your unique style.</p>
        </div>
        <StepBadge step={step} totalSteps={totalSteps} />
      </div>

      <section className="border-edge/80 shadow-glass-xl rounded-[34px] border bg-white/90 p-5 text-left backdrop-blur-sm">
        <div className="border-edge/70 border-b pb-5">
          <div>
            <p className="text-faint text-[11px] font-bold tracking-[0.18em] uppercase">
              Destinations
            </p>
            <p className="text-navy mt-2 text-[26px] leading-tight font-bold">
              {destinationLabel || "TBD"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-surface-neutral rounded-[22px] p-3">
            <p className="text-faint text-[10px] font-bold tracking-[0.18em] uppercase">Budget</p>
            <p className="text-navy mt-1 text-[14px] leading-tight font-semibold">{budgetLabel}</p>
          </div>
          <div className="bg-surface-neutral rounded-[22px] p-3">
            <p className="text-faint text-[10px] font-bold tracking-[0.18em] uppercase">Pace</p>
            <p className="text-navy mt-1 text-[14px] leading-tight font-semibold">{paceLabel}</p>
          </div>
          <div className="bg-surface-neutral rounded-[22px] p-3">
            <p className="text-faint text-[10px] font-bold tracking-[0.18em] uppercase">
              Interests
            </p>
            <p className="text-navy mt-1 text-[14px] leading-tight font-semibold">
              {interests.length} Selected
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
