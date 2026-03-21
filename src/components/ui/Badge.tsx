import type { HTMLAttributes } from "react";

type BadgeVariant = "blue" | "success" | "warning" | "info" | "glass" | "brand" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClass: Record<BadgeVariant, string> = {
  blue: "bg-app-blue text-white",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  glass: "bg-white/20 text-white backdrop-blur-sm",
  brand: "bg-brand-primary-soft text-brand-primary",
  neutral: "bg-surface-soft text-prose",
};

export function Badge({ variant = "neutral", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
