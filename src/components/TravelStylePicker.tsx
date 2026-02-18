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
            className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${
              value === style.id
                ? "border-primary bg-primary/5"
                : "border-border bg-background"
            }`}
          >
            <div className="text-xl mb-1">{style.emoji}</div>
            <div className="text-sm font-medium text-foreground">{style.label}</div>
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
          className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
            value === style.id
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:border-border/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{style.emoji}</span>
            <div>
              <div className="font-semibold text-foreground text-sm">{style.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{style.description}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
