"use client";

interface DevelopmentTagProps {
  label?: string;
  className?: string;
}

export function DevelopmentTag({ label = "In development", className = "" }: DevelopmentTagProps) {
  return (
    <span
      className={`border-v2-border bg-v2-chip-bg text-v2-text-muted inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase ${className}`}
    >
      {label}
    </span>
  );
}
