"use client";

import { useTripStore } from "@/stores/useTripStore";
import { StepBadge } from "./StepBadge";

const priorityOptions = [
  "Finding hidden gems",
  "Staying within budget",
  "Visa & paperwork",
  "Flight connections",
  "Local transport",
  "Language barriers",
  "Safety concerns",
  "Finding the right hotel",
];

interface PrioritiesStepProps {
  step: number;
  totalSteps: number;
}

export function PrioritiesStep({ step, totalSteps }: PrioritiesStepProps) {
  const planningPriority = useTripStore((s) => s.planningPriority);
  const setPlanningPriority = useTripStore((s) => s.setPlanningPriority);

  return (
    <div className="space-y-7 pb-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-bold tracking-[0.34em] text-[#2563ff] uppercase">
            Priorities
          </p>
          <h2 className="text-v2-navy text-[28px] leading-tight font-bold">
            What&apos;s the hardest part?
          </h2>
          <p className="text-v2-text-muted mt-2 text-sm">
            We&apos;ll focus our AI on solving these specific challenges.
          </p>
        </div>
        <StepBadge step={step} totalSteps={totalSteps} />
      </div>

      <section className="max-h-[360px] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 pt-2">
          {priorityOptions.map((option) => {
            const isSelected = planningPriority === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setPlanningPriority(option)}
                aria-pressed={isSelected}
                className={`flex min-h-[110px] flex-col items-start justify-between rounded-[26px] border px-4 py-4 text-left transition-all ${
                  isSelected
                    ? "border-[#d8e7ff] bg-white shadow-[0_18px_34px_rgba(37,99,255,0.08)]"
                    : "border-white/85 bg-white/70 shadow-[0_12px_24px_rgba(27,43,75,0.04)]"
                }`}
              >
                <span className="text-[13px] leading-5 font-bold tracking-[0.04em] text-[#3b4658] uppercase">
                  {option}
                </span>
                <span
                  className={`h-4 w-4 rounded-full border ${
                    isSelected ? "border-[#2563ff] bg-[#2563ff]" : "border-[#e5e7eb] bg-white/70"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
