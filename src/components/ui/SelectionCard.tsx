"use client";

import { type ReactNode } from "react";

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function SelectionCard({ selected, onClick, children, className = "" }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40"
      } ${className}`}
    >
      {children}
    </button>
  );
}
