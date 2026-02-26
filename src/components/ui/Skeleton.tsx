"use client";

interface SkeletonProps {
  className?: string;
}

/** Generic skeleton pulse box — compose with Tailwind sizing. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`bg-secondary animate-pulse rounded ${className}`} />;
}

/** Card-shaped skeleton with a fixed height. */
export function SkeletonCard({ className = "" }: SkeletonProps) {
  return <div className={`bg-secondary h-48 animate-pulse rounded-xl ${className}`} />;
}

/** One line of skeleton text. */
function SkeletonText({ className = "" }: SkeletonProps) {
  return <div className={`bg-secondary h-3 w-full animate-pulse rounded ${className}`} />;
}
