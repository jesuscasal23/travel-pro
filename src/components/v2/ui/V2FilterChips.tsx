"use client";

interface V2FilterChipsProps {
  options: readonly string[];
  active: string;
  onChange: (value: string) => void;
}

export function V2FilterChips({ options, active, onChange }: V2FilterChipsProps) {
  return (
    <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto px-6">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-all ${
            active === option
              ? "bg-v2-navy text-white"
              : "border-v2-border text-v2-navy border bg-white"
          }`}
        >
          <span>{option}</span>
        </button>
      ))}
    </div>
  );
}
