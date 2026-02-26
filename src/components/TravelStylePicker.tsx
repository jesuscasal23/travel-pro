"use client";

import type { TravelStyle } from "@/types";
import { travelStyles } from "@/data/travelStyles";

interface TravelStylePickerProps {
  value: TravelStyle;
  onChange: (style: TravelStyle) => void;
  /** Compact horizontal layout (profile page) vs full vertical cards (onboarding). */
  compact?: boolean;
}

export function TravelStylePicker({ value, onChange, compact }: TravelStylePickerProps) {
  if (compact) {
    return (
      <div className="flex gap-3">
        {travelStyles.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            aria-pressed={value === style.id}
            className={`flex-1 rounded-xl border-2 py-3 text-center transition-all ${
              value === style.id ? "border-primary bg-primary/5" : "border-border bg-background"
            }`}
          >
            <div className="mb-1 text-xl">{style.emoji}</div>
            <div className="text-foreground text-sm font-medium">{style.label}</div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {travelStyles.map((style) => (
        <button
          key={style.id}
          type="button"
          onClick={() => onChange(style.id)}
          aria-pressed={value === style.id}
          className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${
            value === style.id
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:border-border/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{style.emoji}</span>
            <div>
              <div className="text-foreground text-sm font-semibold">{style.label}</div>
              <div className="text-muted-foreground mt-0.5 text-xs">{style.description}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
