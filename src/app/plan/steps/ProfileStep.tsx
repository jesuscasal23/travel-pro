"use client";

import { useTripStore } from "@/stores/useTripStore";
import { ProfileBasicsFields } from "@/components/profile/ProfileBasicsFields";
import { TripDescriptionCard } from "./TripDescriptionCard";

interface ProfileStepProps {
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

export function ProfileStep({ errors, clearError }: ProfileStepProps) {
  const nationality = useTripStore((s) => s.nationality);
  const setNationality = useTripStore((s) => s.setNationality);
  const homeAirport = useTripStore((s) => s.homeAirport);
  const setHomeAirport = useTripStore((s) => s.setHomeAirport);

  return (
    <div className="space-y-6 pb-2">
      <div>
        <h2 className="text-v2-navy text-[28px] leading-tight font-bold">
          Tell us a bit about you
        </h2>
        <p className="text-v2-text-muted mt-2 text-sm">
          We use your profile for visa checks, flight context, and a more useful first itinerary
          draft.
        </p>
      </div>

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

      <TripDescriptionCard compact />
    </div>
  );
}
