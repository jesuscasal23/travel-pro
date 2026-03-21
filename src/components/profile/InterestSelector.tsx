"use client";

import { interestOptions } from "@/data/interests";
import { OptionButton } from "./OptionButton";

interface InterestSelectorProps {
  selected: string[];
  onToggle: (value: string) => void;
}

export function InterestSelector({ selected, onToggle }: InterestSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {interestOptions.map((interest) => (
        <OptionButton
          key={interest.id}
          selected={selected.includes(interest.id)}
          onClick={() => onToggle(interest.id)}
          variant="chip"
          className="rounded-xl px-3 py-2.5 text-left text-sm font-medium"
        >
          <span className="mr-2">{interest.emoji}</span>
          {interest.label}
        </OptionButton>
      ))}
    </div>
  );
}
