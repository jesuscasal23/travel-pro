"use client";

import { nationalities } from "@/data/nationalities";
import {
  travelFieldErrorClass,
  travelFieldLabelClass,
} from "@/components/forms/travel-field-styles";
import { AirportCombobox } from "@/components/ui/AirportCombobox";
import { profileInputClass } from "./travel-profile-options";

interface ProfileBasicsFieldsProps {
  nationality: string;
  homeAirport: string;
  onNationalityChange: (value: string) => void;
  onHomeAirportChange: (value: string) => void;
  nationalityError?: string;
  homeAirportError?: string;
}

export function ProfileBasicsFields({
  nationality,
  homeAirport,
  onNationalityChange,
  onHomeAirportChange,
  nationalityError,
  homeAirportError,
}: ProfileBasicsFieldsProps) {
  return (
    <section className="space-y-4">
      <div>
        <label className={travelFieldLabelClass}>Nationality</label>
        <select
          value={nationality}
          onChange={(event) => onNationalityChange(event.target.value)}
          className={profileInputClass}
          style={{ color: nationality ? "#1b2b4b" : "#9ca3af" }}
        >
          <option value="">Select your nationality</option>
          {nationalities.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
        {nationalityError && <p className={travelFieldErrorClass}>{nationalityError}</p>}
      </div>

      <div>
        <label className={travelFieldLabelClass}>Home Airport</label>
        <AirportCombobox
          value={homeAirport}
          onChange={onHomeAirportChange}
          className={profileInputClass}
          variant="v2"
          placeholder="Search airport or city..."
        />
        {homeAirportError && <p className={travelFieldErrorClass}>{homeAirportError}</p>}
      </div>
    </section>
  );
}
