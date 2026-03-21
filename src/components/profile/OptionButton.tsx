"use client";

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  variant?: "default" | "chip";
  className?: string;
  children: React.ReactNode;
}

const selectedClass = "border-brand-primary bg-brand-primary text-white";
const variants = {
  default: "border-edge text-navy bg-white",
  chip: "bg-chip-bg text-navy border-transparent",
};

export function OptionButton({
  selected,
  onClick,
  variant = "default",
  className = "",
  children,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`border transition-all ${selected ? selectedClass : variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
