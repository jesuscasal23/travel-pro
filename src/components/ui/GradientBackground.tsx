import type { ReactNode } from "react";

interface GradientBackgroundProps {
  children: ReactNode;
  className?: string;
  /** Whether to show the bottom radial gradient overlay (default: true) */
  showBottomGlow?: boolean;
}

export function GradientBackground({
  children,
  className,
  showBottomGlow = true,
}: GradientBackgroundProps) {
  return (
    <div
      className={`relative h-dvh overflow-hidden bg-[image:var(--gradient-page-soft)] ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[image:var(--glow-top)]" />
      {showBottomGlow && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[image:var(--glow-bottom)]" />
      )}
      {children}
    </div>
  );
}
