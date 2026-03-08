"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { mockSummary } from "@/data/v2-mock-data";

const rows = [
  { label: "Travel Profile", value: mockSummary.travelProfile },
  { label: "Budget", value: mockSummary.budget },
  { label: "Destinations", value: mockSummary.destinations },
  { label: "Trip Length", value: mockSummary.tripLength },
];

export default function SummaryPage() {
  const router = useRouter();

  return (
    <OnboardingShell
      progress={95}
      ctaLabel="START PLANNING"
      onCtaClick={() => router.push("/v2/onboarding/signup")}
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
