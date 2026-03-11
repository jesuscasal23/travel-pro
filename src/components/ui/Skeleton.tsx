"use client";

interface SkeletonProps {
  className?: string;
}

/** Generic skeleton pulse box — compose with Tailwind sizing. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`bg-secondary animate-pulse rounded ${className}`} />;
}
