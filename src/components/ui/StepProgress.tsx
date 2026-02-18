"use client";

import { motion } from "framer-motion";

interface StepProgressProps {
  step: number;
  totalSteps: number;
  className?: string;
}

export function StepProgress({ step, totalSteps, className = "mb-8" }: StepProgressProps) {
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Step {step} of {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
