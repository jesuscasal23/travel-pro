"use client";

interface SpectrumSliderProps {
  leftLabel: string;
  rightLabel: string;
  value: number; // 0-100
  onChange: (value: number) => void;
}

export function SpectrumSlider({ leftLabel, rightLabel, value, onChange }: SpectrumSliderProps) {
  return (
    <div className="space-y-2">
      <div className="text-v2-navy flex justify-between text-sm font-medium">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="v2-slider"
      />
    </div>
  );
}
