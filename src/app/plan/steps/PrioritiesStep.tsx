"use client";

import { useTripStore } from "@/stores/useTripStore";
import { StepBadge } from "./StepBadge";
import {
  Compass,
  Wallet,
  FileText,
  Plane,
  Bus,
  Languages,
  ShieldCheck,
  Hotel,
  type LucideIcon,
} from "lucide-react";

type PriorityOption = {
  label: string;
  icon: LucideIcon;
  color: string;
};

const priorityOptions: PriorityOption[] = [
  { label: "Finding hidden gems", icon: Compass, color: "#e85d4a" },
  { label: "Staying within budget", icon: Wallet, color: "#10b981" },
  { label: "Visa & paperwork", icon: FileText, color: "#8b5cf6" },
  { label: "Flight connections", icon: Plane, color: "#3b82f6" },
  { label: "Local transport", icon: Bus, color: "#f59e0b" },
  { label: "Language barriers", icon: Languages, color: "#ec4899" },
  { label: "Safety concerns", icon: ShieldCheck, color: "#06b6d4" },
  { label: "Finding the right hotel", icon: Hotel, color: "#6366f1" },
];

interface PrioritiesStepProps {
  step: number;
  totalSteps: number;
}

export function PrioritiesStep({ step, totalSteps }: PrioritiesStepProps) {
  const planningPriorities = useTripStore((s) => s.planningPriorities);
  const togglePlanningPriority = useTripStore((s) => s.togglePlanningPriority);

  return (
    <div className="space-y-6 pb-1">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
            Priorities
          </p>
          <h2 className="text-v2-navy text-[28px] leading-tight font-bold">
            What&apos;s the hardest part?
          </h2>
          <p className="text-v2-text-muted mt-2 text-sm">
            Select all that apply. We&apos;ll focus our AI on solving these specific challenges.
          </p>
        </div>
        <StepBadge step={step} totalSteps={totalSteps} />
      </div>

      <section className="space-y-2.5 pt-1">
        {priorityOptions.map((option) => {
          const isSelected = planningPriorities.includes(option.label);
          const Icon = option.icon;

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => togglePlanningPriority(option.label)}
              aria-pressed={isSelected}
              className={`flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                isSelected
                  ? "border-brand-primary-border bg-white shadow-[var(--shadow-brand-sm)]"
                  : "border-white/85 bg-white/70 shadow-[0_12px_24px_rgba(27,43,75,0.04)]"
              }`}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${option.color}14` }}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: isSelected ? option.color : "#8ea0bb" }}
                  strokeWidth={2.1}
                />
              </span>

              <span
                className={`flex-1 text-[14px] font-semibold tracking-[-0.01em] ${
                  isSelected ? "text-[#17181c]" : "text-[#3b4658]"
                }`}
              >
                {option.label}
              </span>

              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected
                    ? "border-brand-primary bg-brand-primary"
                    : "border-[#d5dbe5] bg-white/70"
                }`}
              >
                {isSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </section>
    </div>
  );
}
