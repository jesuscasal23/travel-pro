"use client";

interface SkeletonProps {
  className?: string;
}

/** Generic skeleton pulse box — compose with Tailwind sizing. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse bg-secondary rounded ${className}`} />;
}

/** Card-shaped skeleton with a fixed height. */
export function SkeletonCard({ className = "" }: SkeletonProps) {
  return <div className={`h-48 rounded-xl bg-secondary animate-pulse ${className}`} />;
}

/** One line of skeleton text. */
export function SkeletonText({ className = "" }: SkeletonProps) {
  return <div className={`h-3 bg-secondary rounded w-full animate-pulse ${className}`} />;
}
