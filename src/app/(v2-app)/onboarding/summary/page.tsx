"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { useTripStore } from "@/stores/useTripStore";
import { travelStyles } from "@/data/travelStyles";

const paceLabels: Record<string, string> = {
  active: "Fast Explorer",
  moderate: "Balanced Traveler",
  relaxed: "Slow Traveler",
};

export default function SummaryPage() {
  const router = useRouter();
  const travelStyle = useTripStore((s) => s.travelStyle);
  const interests = useTripStore((s) => s.interests);
  const pace = useTripStore((s) => s.pace);

  const styleLabel = travelStyles.find((s) => s.id === travelStyle)?.label ?? "Comfort";
  const paceLabel = paceLabels[pace] ?? "Balanced Traveler";
  const interestsSummary = interests.length > 0 ? interests.slice(0, 3).join(", ") : "Not set";

  const rows = [
    { label: "Travel Style", value: styleLabel },
    { label: "Pace", value: paceLabel },
    { label: "Interests", value: interestsSummary },
  ];

  return (
    <OnboardingShell
      progress={90}
      ctaLabel="START PLANNING"
      onCtaClick={() => router.push("/onboarding/signup")}
    >
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-v2-orange mb-4 text-xs font-bold tracking-wider uppercase">
            BASED ON YOUR ANSWERS
          </p>

          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex justify-between py-3 ${
                i < rows.length - 1 ? "border-v2-border/50 border-b" : ""
              }`}
            >
              <span className="text-v2-text-muted text-sm">{row.label}</span>
              <span className="text-v2-navy text-sm font-bold">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </OnboardingShell>
  );
}
