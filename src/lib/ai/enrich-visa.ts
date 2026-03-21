// ============================================================
// Visa Enrichment — Passport Index static dataset (199 passports x 227 destinations)
// ============================================================

import type { CityStop, VisaInfo } from "@/types";
import { VISA_INDEX } from "@/data/visa-index";
import { VISA_OFFICIAL_URLS } from "@/data/visa-official-urls";
import { NATIONALITY_TO_ISO2 } from "@/data/nationality-to-iso2";
import { createLogger } from "@/lib/core/logger";

const log = createLogger("enrichment:visa");

// Map Passport Index cell value -> VisaInfo fields
function parseRequirement(raw: string): {
  requirement: VisaInfo["requirement"];
  maxStayDays: number;
  label: string;
  icon: string;
  notes: string;
} {
  if (raw === "-1") {
    return {
      requirement: "visa-free",
      maxStayDays: 365,
      label: "Own country",
      icon: "\u{1F3E0}",
      notes: "This is your home country.",
    };
  }
  if (raw === "no admission") {
    return {
      requirement: "no-admission",
      maxStayDays: 0,
      label: "No admission",
      icon: "\u{1F6AB}",
      notes: "Entry not permitted with this passport.",
    };
  }
  if (raw === "visa required") {
    return {
      requirement: "visa-required",
      maxStayDays: 0,
      label: "Visa required",
      icon: "\u{1F6C2}",
      notes: "A visa must be obtained from the embassy before travel.",
    };
  }
  if (raw === "visa on arrival") {
    return {
      requirement: "visa-on-arrival",
      maxStayDays: 30,
      label: "Visa on arrival",
      icon: "\u{1F6EC}",
      notes: "Visa available on arrival. Carry proof of onward travel and sufficient funds.",
    };
  }
  if (raw === "e-visa") {
    return {
      requirement: "e-visa",
      maxStayDays: 30,
      label: "E-visa required",
      icon: "\u{1F4BB}",
      notes:
        "Apply online before travel. Processing times vary \u2014 apply at least 5\u20137 days ahead.",
    };
  }
  if (raw === "eta") {
    return {
      requirement: "eta",
      maxStayDays: 90,
      label: "ETA required",
      icon: "\u{1F4F1}",
      notes:
        "Electronic Travel Authorisation required. Apply online \u2014 usually approved within minutes.",
    };
  }
  if (raw === "visa free") {
    return {
      requirement: "visa-free",
      maxStayDays: 0,
      label: "Visa-free",
      icon: "\u2705",
      notes: "No visa required. Check destination country for exact entry conditions.",
    };
  }
  // Numeric string = visa-free days
  const days = parseInt(raw, 10);
  if (!isNaN(days)) {
    return {
      requirement: "visa-free",
      maxStayDays: days,
      label: `Visa-free (${days} days)`,
      icon: "\u2705",
      notes: `No visa required for stays up to ${days} days.`,
    };
  }
  // Unknown fallback
  return {
    requirement: "visa-required",
    maxStayDays: 0,
    label: "Check embassy",
    icon: "\u{1F6C2}",
    notes: "Requirements unknown \u2014 check the official embassy website.",
  };
}

/**
 * Enrich visa data for each unique country in the route.
 * Uses the Passport Index static dataset (199 passports x 227 destinations).
 */
export async function enrichVisa(passportCountry: string, route: CityStop[]): Promise<VisaInfo[]> {
  const t0 = Date.now();

  // Resolve nationality string -> ISO-2 passport code
  const passportISO2 =
    NATIONALITY_TO_ISO2[passportCountry] ??
    (passportCountry.length === 2 ? passportCountry.toUpperCase() : null);

  // Deduplicate by countryCode
  const seen = new Set<string>();
  const uniqueCountries = route.filter((stop) => {
    if (seen.has(stop.countryCode)) return false;
    seen.add(stop.countryCode);
    return true;
  });

  log.info("enrichVisa: starting", {
    passportCountry,
    passportISO2,
    passportResolved: !!passportISO2,
    routeCities: route.length,
    uniqueCountries: uniqueCountries.length,
    countries: uniqueCountries.map((s) => s.countryCode),
  });

  const results = uniqueCountries.map((stop) => {
    const destISO2 = stop.countryCode;
    const source = VISA_OFFICIAL_URLS[destISO2] ?? {
      url: "https://www.timatic.iata.org",
      label: "IATA Timatic",
    };

    // Look up in the index
    const raw = passportISO2 ? VISA_INDEX[passportISO2]?.[destISO2] : undefined;

    if (raw) {
      const parsed = parseRequirement(raw);
      return {
        country: stop.country,
        countryCode: destISO2,
        ...parsed,
        sourceUrl: source.url,
        sourceLabel: source.label,
      };
    }

    // Passport not found in index -- generic fallback
    return {
      country: stop.country,
      countryCode: destISO2,
      requirement: "visa-required" as const,
      maxStayDays: 0,
      notes: "We don't have data for this passport. Check the official embassy website.",
      icon: "\u{1F6C2}",
      label: "Check embassy",
      sourceUrl: source.url,
      sourceLabel: source.label,
    };
  });

  log.info("enrichVisa: complete", {
    duration: `${Date.now() - t0}ms`,
    resultCount: results.length,
    results: results.map((r) => ({
      country: r.country,
      countryCode: r.countryCode,
      requirement: r.requirement,
      label: r.label,
    })),
  });

  return results;
}
