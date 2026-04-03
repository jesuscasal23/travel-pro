"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { CountryRecord } from "@/types";
import { Combobox } from "./Combobox";
import { useCombobox } from "./useCombobox";

interface Props {
  countries: CountryRecord[];
  value: string; // stored as country name, e.g. "Japan"
  onChange: (entry: CountryRecord) => void;
  className?: string;
  placeholder?: string;
  variant?: "subtle" | "branded";
}

const filterCountries = (countries: CountryRecord[], query: string): CountryRecord[] => {
  const q = query.toLowerCase().trim();
  const dataset = q ? countries : countries.filter((c) => c.popular);
  return dataset
    .filter((c) => c.country.toLowerCase().includes(q) || c.countryCode.toLowerCase().startsWith(q))
    .slice(0, 8);
};

export function CountryCombobox({
  countries,
  value,
  onChange,
  className = "",
  placeholder = "Search country\u2026",
  variant = "subtle",
}: Props) {
  const popularDefaults = useMemo(
    () => countries.filter((c) => c.popular).slice(0, 8),
    [countries]
  );
  const filter = useCallback((query: string) => filterCountries(countries, query), [countries]);
  const { results, hasQuery, handleQueryChange } = useCombobox({
    filter,
    initialResults: popularDefaults,
  });
  useEffect(() => {
    handleQueryChange("");
  }, [countries, handleQueryChange]);
  const isBranded = variant === "branded";

  return (
    <Combobox<CountryRecord>
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
        !hasQuery && popularDefaults.length > 0 ? (
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
