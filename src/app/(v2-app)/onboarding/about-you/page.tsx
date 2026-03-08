"use client";

import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/v2/OnboardingShell";
import { useTripStore } from "@/stores/useTripStore";
import { nationalities } from "@/data/nationalities";
import { AirportCombobox } from "@/components/ui/AirportCombobox";

export default function AboutYouPage() {
  const router = useRouter();
  const nationality = useTripStore((s) => s.nationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const setNationality = useTripStore((s) => s.setNationality);
  const setHomeAirport = useTripStore((s) => s.setHomeAirport);

  return (
    <OnboardingShell
      progress={15}
      ctaLabel="CONTINUE"
      ctaDisabled={!nationality}
      onCtaClick={() => router.push("/onboarding/preferences")}
    >
      <h1 className="text-v2-navy text-2xl font-bold">Where are you from?</h1>
      <p className="text-v2-text-muted mb-8 text-sm">
        This helps us check visa requirements and find the best flights.
      </p>

      <div className="space-y-6">
        {/* Nationality */}
        <div>
          <label className="text-v2-navy mb-2 block text-sm font-semibold">Nationality</label>
          <select
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="border-v2-border text-v2-navy focus:border-v2-orange w-full rounded-xl border bg-white px-4 py-3.5 text-sm outline-none"
          >
            <option value="">Select your nationality</option>
            {nationalities.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Home Airport */}
        <div>
          <label className="text-v2-navy mb-2 block text-sm font-semibold">Home Airport</label>
          <AirportCombobox
            value={homeAirport}
            onChange={setHomeAirport}
            className="border-v2-border !rounded-xl !border !bg-white !px-4 !py-3.5 text-sm"
            placeholder="Search airport or city…"
          />
        </div>
      </div>
    </OnboardingShell>
  );
}
