"use client";

import { Check } from "lucide-react";
import { travelStyles } from "@/data/travelStyles";
import type { TravelStyle } from "@/types";

interface TravelStyleSelectorProps {
  value: TravelStyle;
  onChange: (value: TravelStyle) => void;
  variant?: "grid" | "list";
}

export function TravelStyleSelector({
  value,
  onChange,
  variant = "list",
}: TravelStyleSelectorProps) {
  if (variant === "grid") {
    return (
      <div className="grid grid-cols-3 gap-3">
        {travelStyles.map((style) => {
          const isSelected = value === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              aria-pressed={isSelected}
              className={`relative rounded-[22px] border px-3 py-4 text-center transition-all ${
                isSelected
                  ? "bg-v2-orange border-v2-orange text-white shadow-[0_14px_30px_rgba(249,115,22,0.24)]"
                  : "border-v2-border text-v2-navy bg-white"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className="text-2xl">{style.emoji}</div>
              <div className="mt-2 text-sm font-bold">{style.label}</div>
              <p className="mt-1 text-[11px] leading-relaxed opacity-80">{style.description}</p>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {travelStyles.map((style) => {
        const isSelected = value === style.id;
        return (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            aria-pressed={isSelected}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
              isSelected
                ? "bg-v2-orange border-v2-orange text-white"
                : "border-v2-border text-v2-navy bg-white"
            }`}
          >
            <div className="text-sm font-bold">{style.label}</div>
            <p className="mt-1 text-xs leading-relaxed opacity-80">{style.description}</p>
          </button>
        );
      })}
    </div>
  );
}
