"use client";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

function Chip({ label, selected = false, onClick, className = "" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`chip ${selected ? "chip-selected" : ""} ${className}`}
    >
      {label}
    </button>
  );
}

interface ChipGroupProps {
  options: { id: string; label: string; emoji?: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  className?: string;
}

export function ChipGroup({ options, selected, onToggle, className = "" }: ChipGroupProps) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {options.map((opt) => (
        <Chip
          key={opt.id}
          label={opt.emoji ? `${opt.emoji} ${opt.label}` : opt.label}
          selected={selected.includes(opt.id)}
          onClick={() => onToggle(opt.id)}
        />
      ))}
    </div>
  );
}
