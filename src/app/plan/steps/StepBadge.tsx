"use client";

interface StepBadgeProps {
  step: number;
  totalSteps: number;
}

export function StepBadge({ step, totalSteps }: StepBadgeProps) {
  return (
    <div className="shrink-0 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] text-[#8ea0bb] uppercase shadow-[0_12px_24px_rgba(27,43,75,0.05)]">
      {step}/{totalSteps}
    </div>
  );
}
