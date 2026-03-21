"use client";

interface StepBadgeProps {
  step: number;
  totalSteps: number;
}

export function StepBadge({ step, totalSteps }: StepBadgeProps) {
  return (
    <div className="text-label shadow-glass-sm shrink-0 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase">
      {step}/{totalSteps}
    </div>
  );
}
