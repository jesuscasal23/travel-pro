"use client";

import { CITIES } from "@/data/cities";
import { Combobox } from "./Combobox";
import { useCombobox } from "./useCombobox";

interface CountryEntry {
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  popular: boolean;
}

/** Build unique country list from CITIES data (computed once at module level) */
const COUNTRIES: CountryEntry[] = (() => {
  const seen = new Map<string, CountryEntry>();
  for (const c of CITIES) {
    if (!seen.has(c.countryCode)) {
      seen.set(c.countryCode, {
        country: c.country,
        countryCode: c.countryCode,
        lat: c.lat,
        lng: c.lng,
        popular: !!c.popular,
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.country.localeCompare(b.country));
})();

interface Props {
  value: string; // stored as country name, e.g. "Japan"
  onChange: (entry: CountryEntry) => void;
  className?: string;
  placeholder?: string;
  variant?: "subtle" | "branded";
}

const filterCountries = (query: string): CountryEntry[] => {
  const q = query.toLowerCase().trim();
  if (!q) return COUNTRIES.filter((c) => c.popular);
  return COUNTRIES.filter(
    (c) => c.country.toLowerCase().includes(q) || c.countryCode.toLowerCase().startsWith(q)
  ).slice(0, 8);
};

export function CountryCombobox({
  value,
  onChange,
  className = "",
  placeholder = "Search country\u2026",
  variant = "subtle",
}: Props) {
  const { results, hasQuery, handleQueryChange } = useCombobox({ filter: filterCountries });
  const isBranded = variant === "branded";

  return (
    <Combobox<CountryEntry>
      value={value}
      results={results}
      onQueryChange={handleQueryChange}
      onSelect={onChange}
      getKey={(c) => c.countryCode}
      placeholder={placeholder}
      className={className}
      variant={variant}
      emptyMessage={(q) => <>No countries found for &ldquo;{q}&rdquo;</>}
      listHeader={
        !hasQuery ? (
          <li
            className={`border-b px-4 py-1.5 text-xs font-medium ${
              isBranded ? "border-edge text-dim bg-chip-bg" : "text-muted-foreground border-border"
            }`}
          >
            Popular countries
          </li>
        ) : undefined
      }
      renderItem={(c) => (
        <>
          <span className={`${isBranded ? "text-navy" : "text-foreground"} truncate font-medium`}>
            {c.country}
          </span>
          <span
            className={`ml-auto w-6 shrink-0 font-mono text-xs ${
              isBranded ? "text-faint" : "text-muted-foreground/60"
            }`}
          >
            {c.countryCode}
          </span>
        </>
      )}
    />
  );
}
