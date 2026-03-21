"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "ghost"
    | "danger"
    | "danger-outline"
    | "brand"
    | "dark"
    | "outline"
    | "apple";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

/* ── Variant base classes ── */
const baseClass = "inline-flex items-center justify-center font-medium transition-all duration-200";

/* Variants that respect the size system (primary, ghost, danger, danger-outline) */
const sizedVariants: Record<string, string> = {
  primary: `${baseClass} bg-primary text-primary-foreground rounded-lg hover:opacity-90 active:scale-[0.97]`,
  ghost: `${baseClass} text-foreground border-border rounded-lg border bg-transparent hover:bg-muted active:scale-[0.97]`,
  danger: `${baseClass} bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 active:scale-[0.97]`,
  "danger-outline": `${baseClass} border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 active:scale-[0.97]`,
};

const sizeClass: Record<string, string> = {
  xs: "text-xs py-1.5 px-3",
  sm: "text-sm py-2 px-4",
  md: "",
  lg: "text-base py-3.5 px-8",
};

const iconOnlySize: Record<string, string> = {
  xs: "w-7 h-7",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

/* Variants with self-contained sizing (rounded-xl px-6 py-4) */
const fullVariants: Record<string, string> = {
  brand: `${baseClass} rounded-xl px-6 py-4 text-base font-bold tracking-wide active:scale-[0.98] disabled:opacity-50 bg-brand-primary text-white shadow-brand-sm hover:brightness-105`,
  dark: `${baseClass} rounded-xl px-6 py-4 text-base font-bold tracking-wide active:scale-[0.98] disabled:opacity-50 bg-navy text-white border-b-[3px] border-app-pink hover:bg-navy-light`,
  outline: `${baseClass} rounded-xl px-6 py-4 text-base font-bold tracking-wide active:scale-[0.98] disabled:opacity-50 bg-white text-navy border border-edge hover:bg-chip-bg font-semibold`,
  apple: `${baseClass} rounded-xl px-6 py-4 text-base font-bold tracking-wide active:scale-[0.98] disabled:opacity-50 bg-navy text-white hover:bg-navy-light font-semibold`,
};

const isFullVariant = (v: string): v is keyof typeof fullVariants => v in fullVariants;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      iconOnly = false,
      fullWidth = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    let classes: string;

    if (isFullVariant(variant)) {
      classes = fullVariants[variant];
    } else {
      const base = sizedVariants[variant] ?? sizedVariants.primary;
      const sizeStyles = iconOnly
        ? `${iconOnlySize[size]} rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors`
        : sizeClass[size];
      classes = `${base} ${sizeStyles}`;
    }

    return (
      <button
        ref={ref}
        className={`${classes} focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
