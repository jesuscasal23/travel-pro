"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "danger-outline";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  iconOnly?: boolean;
}

const variantClass: Record<string, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger:
    "bg-red-600 text-white rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center hover:bg-red-700",
  "danger-outline":
    "border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950",
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      iconOnly = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const base = variantClass[variant];
    const sizeStyles = iconOnly
      ? `${iconOnlySize[size]} rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors`
      : sizeClass[size];

    return (
      <button
        ref={ref}
        className={`${base} ${sizeStyles} disabled:opacity-60 ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
