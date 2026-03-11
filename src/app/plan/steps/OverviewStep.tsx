"use client";

import { travelStyles } from "@/data/travelStyles";
import { regions } from "@/data/sampleData";
import { useTripStore } from "@/stores/useTripStore";
import { StepBadge } from "./StepBadge";

function pickVibeLabel(value: number, left: string, right: string) {
  return value >= 50 ? right : left;
}

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
  const vibeAdventureComfort = useTripStore((s) => s.vibeAdventureComfort);
  const vibeSocialQuiet = useTripStore((s) => s.vibeSocialQuiet);
  const vibeLuxuryBudget = useTripStore((s) => s.vibeLuxuryBudget);
  const vibeStructuredSpontaneous = useTripStore((s) => s.vibeStructuredSpontaneous);
  const vibeWarmMixed = useTripStore((s) => s.vibeWarmMixed);

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

  const styleProfile = [
    pickVibeLabel(vibeAdventureComfort, "Adventure", "Comfort"),
    pickVibeLabel(vibeSocialQuiet, "Social", "Quiet"),
    pickVibeLabel(vibeLuxuryBudget, "Luxury", "Budget"),
    pickVibeLabel(vibeStructuredSpontaneous, "Structured", "Spontaneous"),
    pickVibeLabel(vibeWarmMixed, "Warm Weather", "Mixed Climates"),
  ];

  return (
    <div className="space-y-5 pb-2 text-center">
      <div className="flex items-start justify-between gap-4 text-left">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[11px] font-bold tracking-[0.34em] text-[#10b981] uppercase">
            Profile Complete
          </p>
          <h2 className="text-v2-navy mt-3 text-[30px] leading-[1.06] font-bold tracking-[-0.05em]">
            Your Travel DNA is ready
          </h2>
          <p className="text-v2-text-muted mt-2 text-sm">We&apos;ve captured your unique style.</p>
        </div>
        <StepBadge step={step} totalSteps={totalSteps} />
      </div>

      <section className="border-v2-border/80 rounded-[34px] border bg-white/90 p-5 text-left shadow-[0_24px_48px_rgba(27,43,75,0.06)] backdrop-blur-sm">
        <div className="border-v2-border/70 border-b pb-5">
          <div>
            <p className="text-v2-text-light text-[11px] font-bold tracking-[0.18em] uppercase">
              Destinations
            </p>
            <p className="text-v2-navy mt-2 text-[26px] leading-tight font-bold">
              {destinationLabel || "TBD"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-[22px] bg-[#f7f9fc] p-3">
            <p className="text-v2-text-light text-[10px] font-bold tracking-[0.18em] uppercase">
              Budget
            </p>
            <p className="text-v2-navy mt-1 text-[14px] leading-tight font-semibold">
              {budgetLabel}
            </p>
          </div>
          <div className="rounded-[22px] bg-[#f7f9fc] p-3">
            <p className="text-v2-text-light text-[10px] font-bold tracking-[0.18em] uppercase">
              Pace
            </p>
            <p className="text-v2-navy mt-1 text-[14px] leading-tight font-semibold">{paceLabel}</p>
          </div>
          <div className="rounded-[22px] bg-[#f7f9fc] p-3">
            <p className="text-v2-text-light text-[10px] font-bold tracking-[0.18em] uppercase">
              Interests
            </p>
            <p className="text-v2-navy mt-1 text-[14px] leading-tight font-semibold">
              {interests.length} Selected
            </p>
          </div>
        </div>

        <div className="border-v2-border mt-5 border-t pt-5">
          <p className="text-v2-text-light text-[11px] font-bold tracking-[0.18em] uppercase">
            Your Style Profile
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {styleProfile.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[11px] font-bold tracking-[0.06em] text-[#2563ff] uppercase"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
