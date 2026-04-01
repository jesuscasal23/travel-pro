import type { VisaInfo } from "@/types";

/**
 * ISO-2 country codes for all Schengen Area member states.
 * As of 2025: 29 countries (EU Schengen + EFTA Schengen).
 */
export const SCHENGEN_COUNTRY_CODES = new Set([
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "HR", // Croatia
  "CZ", // Czech Republic
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "HU", // Hungary
  "IS", // Iceland
  "IT", // Italy
  "LV", // Latvia
  "LI", // Liechtenstein
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "NO", // Norway
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden
  "CH", // Switzerland
]);

/**
 * Determine whether the visa section should be hidden entirely.
 *
 * Returns true (= hide) when:
 * 1. All destinations are the user's own country (every visa entry is "Own country"), OR
 * 2. The user holds a Schengen passport AND all destinations are Schengen countries.
 */
export function shouldHideVisaSection(
  visaData: VisaInfo[] | undefined,
  passportCountryCode: string | undefined,
  destinationCountryCodes: string[]
): boolean {
  if (!visaData || visaData.length === 0) return false;

  // Condition 1: All destinations are user's own country
  const allOwnCountry = visaData.every((v) => v.label === "Own country");
  if (allOwnCountry) return true;

  // Condition 2: Schengen passport + all destinations Schengen
  if (
    passportCountryCode &&
    SCHENGEN_COUNTRY_CODES.has(passportCountryCode) &&
    destinationCountryCodes.length > 0 &&
    destinationCountryCodes.every((code) => SCHENGEN_COUNTRY_CODES.has(code))
  ) {
    return true;
  }

  return false;
}

/**
 * Returns true when a Schengen 90/180-day cumulative warning should be shown.
 *
 * Conditions: non-Schengen passport AND at least one destination is a Schengen
 * country AND that destination allows entry (requirement is not visa-required
 * or no-admission — those get their own separate guidance).
 */
export function needsSchengenWarning(
  passportISO2: string | undefined,
  visaData: VisaInfo[]
): boolean {
  if (!passportISO2 || SCHENGEN_COUNTRY_CODES.has(passportISO2)) return false;
  return visaData.some(
    (v) =>
      SCHENGEN_COUNTRY_CODES.has(v.countryCode) &&
      v.requirement !== "visa-required" &&
      v.requirement !== "no-admission"
  );
}
