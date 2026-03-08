"use client";

import { ProgressBar } from "@/components/v2/ui/ProgressBar";
import { Button } from "@/components/v2/ui/Button";

interface OnboardingShellProps {
  progress?: number; // 0-100, omit to hide progress bar
  ctaLabel: string;
  ctaVariant?: "primary" | "dark";
  onCtaClick: () => void;
  ctaDisabled?: boolean;
  children: React.ReactNode;
}

export function OnboardingShell({
  progress,
  ctaLabel,
  ctaVariant = "primary",
  onCtaClick,
  ctaDisabled,
  children,
}: OnboardingShellProps) {
  return (
    <div className="flex h-full min-h-dvh flex-col">
      {progress !== undefined && <ProgressBar progress={progress} />}
      <div className="flex-1 px-6 pt-10 pb-4">{children}</div>
      <div className="shrink-0 px-6 pt-2 pb-8">
        <Button variant={ctaVariant} onClick={onCtaClick} disabled={ctaDisabled}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
