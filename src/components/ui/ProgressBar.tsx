"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
}

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  return (
    <div className={`h-2 bg-secondary rounded-full overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-primary rounded-full"
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
