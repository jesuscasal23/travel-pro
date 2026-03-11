"use client";

import type { ActivityPace } from "@/types";
import { paceOptions } from "./travel-profile-options";

interface PaceSelectorProps {
  value: ActivityPace;
  onChange: (value: ActivityPace) => void;
}

export function PaceSelector({ value, onChange }: PaceSelectorProps) {
  return (
    <div className="space-y-2.5">
      {paceOptions.map((option) => {
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={isSelected}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
              isSelected
                ? "bg-v2-orange border-v2-orange text-white"
                : "border-v2-border text-v2-navy bg-white"
            }`}
          >
            <div className="text-sm font-bold">{option.title}</div>
            <p className="mt-1 text-xs leading-relaxed opacity-80">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}
