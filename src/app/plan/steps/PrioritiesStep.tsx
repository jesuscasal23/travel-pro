"use client";

import { usePlanFormStore } from "@/stores/usePlanFormStore";
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
  iconClass: string;
  bgClass: string;
};

const priorityOptions: PriorityOption[] = [
  {
    label: "Finding hidden gems",
    icon: Compass,
    iconClass: "text-accent",
    bgClass: "bg-accent/10",
  },
  {
    label: "Staying within budget",
    icon: Wallet,
    iconClass: "text-app-green",
    bgClass: "bg-app-green/10",
  },
  {
    label: "Visa & paperwork",
    icon: FileText,
    iconClass: "text-app-purple",
    bgClass: "bg-app-purple/10",
  },
  {
    label: "Flight connections",
    icon: Plane,
    iconClass: "text-app-blue",
    bgClass: "bg-app-blue/10",
  },
  { label: "Local transport", icon: Bus, iconClass: "text-app-amber", bgClass: "bg-app-amber/10" },
  {
    label: "Language barriers",
    icon: Languages,
    iconClass: "text-app-pink",
    bgClass: "bg-app-pink/10",
  },
  {
    label: "Safety concerns",
    icon: ShieldCheck,
    iconClass: "text-app-cyan",
    bgClass: "bg-app-cyan/10",
  },
  {
    label: "Finding the right hotel",
    icon: Hotel,
    iconClass: "text-app-indigo",
    bgClass: "bg-app-indigo/10",
  },
];

interface PrioritiesStepProps {
  step: number;
  totalSteps: number;
}

export function PrioritiesStep({ step, totalSteps }: PrioritiesStepProps) {
  const planningPriorities = usePlanFormStore((s) => s.planningPriorities);
  const togglePlanningPriority = usePlanFormStore((s) => s.togglePlanningPriority);

  return (
    <div className="space-y-6 pb-1">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
            Priorities
          </p>
          <h2 className="text-navy text-[28px] leading-tight font-bold">
            What&apos;s the hardest part?
          </h2>
          <p className="text-dim mt-2 text-sm">
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
                  : "shadow-glass-sm border-white/85 bg-white/70"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${option.bgClass}`}
              >
                <Icon
                  className={`h-5 w-5 ${isSelected ? option.iconClass : "text-label"}`}
                  strokeWidth={2.1}
                />
              </span>

              <span
                className={`flex-1 text-[14px] font-semibold tracking-[-0.01em] ${
                  isSelected ? "text-heading" : "text-prose"
                }`}
              >
                {option.label}
              </span>

              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected
                    ? "border-brand-primary bg-brand-primary"
                    : "border-checkbox-border bg-white/70"
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
