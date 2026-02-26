"use client";

import { motion } from "framer-motion";
import { Plane } from "lucide-react";

interface StepProgressProps {
  step: number;
  totalSteps: number;
  className?: string;
}

export function StepProgress({ step, totalSteps, className = "mb-8" }: StepProgressProps) {
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;
            return (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    isCurrent
                      ? "bg-primary text-white shadow-sm"
                      : isCompleted
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Plane className="h-3 w-3 fill-current" /> : stepNum}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`h-px w-6 transition-all ${isCompleted ? "bg-primary/40" : "bg-border"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <span className="text-muted-foreground text-xs">{pct}% complete</span>
      </div>
      <div className="bg-secondary h-1.5 overflow-hidden rounded-full">
        <motion.div
          className="bg-primary h-full rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
