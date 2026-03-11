"use client";

import { interestOptions } from "@/data/interests";

interface InterestSelectorProps {
  selected: string[];
  onToggle: (value: string) => void;
}

export function InterestSelector({ selected, onToggle }: InterestSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {interestOptions.map((interest) => {
        const isSelected = selected.includes(interest.id);
        return (
          <button
            key={interest.id}
            type="button"
            onClick={() => onToggle(interest.id)}
            aria-pressed={isSelected}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
              isSelected
                ? "bg-v2-orange border-v2-orange text-white"
                : "bg-v2-chip-bg text-v2-navy border-transparent"
            }`}
          >
            <span className="mr-2">{interest.emoji}</span>
            {interest.label}
          </button>
        );
      })}
    </div>
  );
}
