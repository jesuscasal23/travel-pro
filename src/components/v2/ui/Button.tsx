"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "dark" | "outline" | "apple" | "ghost";
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const base =
    "w-full rounded-xl px-6 py-4 text-base font-bold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer";

  const variants: Record<string, string> = {
    primary:
      "bg-v2-orange text-white shadow-[0_4px_14px_rgba(249,115,22,0.4)] hover:brightness-105",
    dark: "bg-v2-navy text-white border-b-[3px] border-v2-pink hover:bg-v2-navy-light",
    outline: "bg-white text-v2-navy border border-v2-border hover:bg-v2-chip-bg font-semibold",
    apple: "bg-v2-navy text-white hover:bg-v2-navy-light font-semibold",
    ghost: "bg-transparent text-v2-text-muted hover:text-v2-navy font-medium py-2",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
