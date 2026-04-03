"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { CityRecord } from "@/types";
import { Combobox } from "./Combobox";
import { useCombobox } from "./useCombobox";

interface Props {
  cities: CityRecord[];
  value: string; // stored as "Tokyo, Japan"
  onChange: (entry: CityRecord) => void;
  className?: string;
  placeholder?: string;
  variant?: "subtle" | "branded";
}

const filterCities = (cities: CityRecord[], query: string): CityRecord[] => {
  const q = query.toLowerCase().trim();
  const dataset = q ? cities : cities.filter((c) => c.popular);
  return dataset
    .filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.countryCode.toLowerCase().startsWith(q)
    )
    .slice(0, 8);
};

export function CityCombobox({
  cities,
  value,
  onChange,
  className = "",
  placeholder = "Search city or country\u2026",
  variant = "subtle",
}: Props) {
  const popularDefaults = useMemo(() => cities.filter((c) => c.popular).slice(0, 8), [cities]);
  const filter = useCallback((query: string) => filterCities(cities, query), [cities]);
  const { results, hasQuery, handleQueryChange } = useCombobox({
    filter,
    initialResults: popularDefaults,
  });
  useEffect(() => {
    handleQueryChange("");
  }, [cities, handleQueryChange]);
  const isBranded = variant === "branded";

  return (
    <Combobox<CityRecord>
      value={value}
      results={results}
      onQueryChange={handleQueryChange}
      onSelect={onChange}
      getKey={(c) => `${c.countryCode}-${c.city}`}
      placeholder={placeholder}
      className={className}
      variant={variant}
      emptyMessage={(q) => <>No cities found for &ldquo;{q}&rdquo;</>}
      listHeader={
        !hasQuery && popularDefaults.length > 0 ? (
          <li
            className={`border-b px-4 py-1.5 text-xs font-medium ${
              isBranded ? "border-edge text-dim bg-chip-bg" : "text-muted-foreground border-border"
            }`}
          >
            Popular destinations
          </li>
        ) : undefined
      }
      renderItem={(c) => (
        <>
          <span className={`${isBranded ? "text-navy" : "text-foreground"} truncate font-medium`}>
            {c.city}
          </span>
          <span className={`ml-auto shrink-0 ${isBranded ? "text-dim" : "text-muted-foreground"}`}>
            {c.country}
          </span>
          <span
            className={`w-6 shrink-0 font-mono text-xs ${
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
