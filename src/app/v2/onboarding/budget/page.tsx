"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { budgetTiers } from "@/data/v2-mock-data";

export default function BudgetPage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  return (
    <OnboardingShell
      progress={50}
      ctaLabel="CONTINUE"
      onCtaClick={() => router.push("/v2/onboarding/pace")}
    >
      <h1 className="text-v2-navy text-2xl font-bold">What&apos;s your budget?</h1>
      <p className="text-v2-text-muted mb-6 text-sm">
        We&apos;ll tailor recommendations to your range
      </p>

      <div className="space-y-3">
        {budgetTiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTier(tier.id)}
              className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all ${
                isSelected ? "border-v2-orange bg-orange-50" : "border-v2-border bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`${tier.iconBg} ${tier.iconColor} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`}
                >
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-v2-navy font-semibold">{tier.label}</span>
                    <span className={`text-sm font-semibold ${tier.color}`}>{tier.range}</span>
                  </div>
                  <p className="text-v2-text-muted text-sm">{tier.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
