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
      className={`relative h-dvh overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fb_55%,#eef2f7_100%)] ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-72 bg-[radial-gradient(circle_at_top,var(--brand-primary-glow)_0%,transparent_62%)]" />
      {showBottomGlow && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(circle_at_bottom,#1b2b4b10_0%,transparent_60%)]" />
      )}
      {children}
    </div>
  );
}
