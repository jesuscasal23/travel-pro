"use client";

import { Info } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
import { ProfileBasicsFields } from "@/components/profile/ProfileBasicsFields";
import { StepBadge } from "./StepBadge";

interface ProfileStepProps {
  errors: Record<string, string>;
  clearError: (field: string) => void;
  step: number;
  totalSteps: number;
}

export function ProfileStep({ errors, clearError, step, totalSteps }: ProfileStepProps) {
  const nationality = useTripStore((s) => s.nationality);
  const setNationality = useTripStore((s) => s.setNationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const setHomeAirport = useTripStore((s) => s.setHomeAirport);

  return (
    <div className="space-y-7 pb-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-brand-primary font-display text-[11px] font-bold tracking-[0.34em] uppercase">
            Details
          </p>
          <h2 className="text-v2-navy text-[28px] leading-tight font-bold">The essentials</h2>
          <p className="text-v2-text-muted mt-2 text-sm">
            We use this to calculate visa requirements and flight prices.
          </p>
        </div>
        <StepBadge step={step} totalSteps={totalSteps} />
      </div>

      <section className="space-y-5 rounded-[34px] border border-white/80 bg-white/88 p-5">
        <ProfileBasicsFields
          nationality={nationality}
          homeAirport={homeAirport}
          onNationalityChange={(value) => {
            setNationality(value);
            clearError("nationality");
          }}
          onHomeAirportChange={(value) => {
            setHomeAirport(value);
            clearError("homeAirport");
          }}
          nationalityError={errors.nationality}
          homeAirportError={errors.homeAirport}
        />
      </section>

      <section className="border-v2-border/80 bg-brand-primary-subtle flex items-start gap-4 rounded-[28px] border px-5 py-5">
        <div className="border-v2-border flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-white">
          <Info className="text-brand-primary h-4 w-4" strokeWidth={2.4} />
        </div>
        <p className="text-sm leading-6 font-semibold text-[#6f86aa]">
          Your data is encrypted and used only to personalize your travel experience.
        </p>
      </section>
    </div>
  );
}
