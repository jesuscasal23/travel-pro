import type { HTMLAttributes } from "react";

type CardVariant = "glass" | "solid" | "outline";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Override default padding. Pass "" to remove padding entirely. */
  padding?: "sm" | "md" | "lg" | "none";
}

const variantClass: Record<CardVariant, string> = {
  glass: "border border-white/80 bg-white/88 backdrop-blur-sm shadow-glass",
  solid: "bg-card shadow-card",
  outline: "border border-edge bg-white",
};

const paddingClass: Record<NonNullable<CardProps["padding"]>, string> = {
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
  none: "",
};

export function Card({
  variant = "glass",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl ${variantClass[variant]} ${paddingClass[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
