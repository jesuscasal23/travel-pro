"use client";

interface BadgeProps {
  variant: "success" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}

const variantClass = {
  success: "badge-success",
  warning: "badge-warning",
  info: "badge-info",
} as const;

export function Badge({ variant, children, className = "" }: BadgeProps) {
  return <span className={`${variantClass[variant]} ${className}`}>{children}</span>;
}
