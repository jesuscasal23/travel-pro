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

/* ── Classic variants (use size system) ── */
const classicVariants: Record<string, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger:
    "bg-red-600 dark:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center hover:bg-red-700 dark:hover:bg-red-800 active:scale-[0.97]",
  "danger-outline":
    "border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950 active:scale-[0.97]",
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

/* ── Modern variants (self-contained sizing: rounded-xl px-6 py-4) ── */
const modernBase =
  "rounded-xl px-6 py-4 text-base font-bold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 inline-flex items-center justify-center";

const modernVariants: Record<string, string> = {
  brand: "bg-brand-primary text-white shadow-brand-sm hover:brightness-105",
  dark: "bg-navy text-white border-b-[3px] border-app-pink hover:bg-navy-light",
  outline: "bg-white text-navy border border-edge hover:bg-chip-bg font-semibold",
  apple: "bg-navy text-white hover:bg-navy-light font-semibold",
};

const isModernVariant = (v: string): v is keyof typeof modernVariants => v in modernVariants;

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

    if (isModernVariant(variant)) {
      classes = `${modernBase} ${modernVariants[variant]}`;
    } else {
      const base = classicVariants[variant] ?? classicVariants.primary;
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
