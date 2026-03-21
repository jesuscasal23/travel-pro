"use client";

import type { ActivityPace } from "@/types";
import { paceOptions } from "./travel-profile-options";
import { OptionButton } from "./OptionButton";

interface PaceSelectorProps {
  value: ActivityPace;
  onChange: (value: ActivityPace) => void;
}

export function PaceSelector({ value, onChange }: PaceSelectorProps) {
  return (
    <div className="space-y-2.5">
      {paceOptions.map((option) => (
        <OptionButton
          key={option.id}
          selected={value === option.id}
          onClick={() => onChange(option.id)}
          className="w-full rounded-2xl px-4 py-3 text-left"
        >
          <div className="text-sm font-bold">{option.title}</div>
          <p className="mt-1 text-xs leading-relaxed opacity-80">{option.description}</p>
        </OptionButton>
      ))}
    </div>
  );
}
