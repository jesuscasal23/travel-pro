"use client";

import { travelStyles } from "@/data/travelStyles";
import type { TravelStyle } from "@/types";
import { OptionButton } from "./OptionButton";

interface TravelStyleSelectorProps {
  value: TravelStyle;
  onChange: (value: TravelStyle) => void;
}

export function TravelStyleSelector({ value, onChange }: TravelStyleSelectorProps) {
  return (
    <div className="space-y-2.5">
      {travelStyles.map((style) => (
        <OptionButton
          key={style.id}
          selected={value === style.id}
          onClick={() => onChange(style.id)}
          className="w-full rounded-2xl px-4 py-3 text-left"
        >
          <div className="text-sm font-bold">{style.label}</div>
          <p className="mt-1 text-xs leading-relaxed opacity-80">{style.description}</p>
        </OptionButton>
      ))}
    </div>
  );
}
