"use client";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 40, className = "" }: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-pulse rounded-full bg-primary/30 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
