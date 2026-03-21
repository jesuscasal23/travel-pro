"use client";

import { useState, useCallback } from "react";
import { CITIES, type CityEntry } from "@/data/cities";
import { Combobox } from "./Combobox";

interface Props {
  value: string; // stored as "Tokyo, Japan"
  onChange: (entry: CityEntry) => void;
  className?: string;
  placeholder?: string;
  variant?: "subtle" | "branded";
}

/** Show popular cities when query is empty */
function getPopularCities(): CityEntry[] {
  return CITIES.filter((c) => c.popular);
}

/** Filter cities by query — matches city name, country name, or country code */
function filterCities(query: string): CityEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return getPopularCities();
  return CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.countryCode.toLowerCase().startsWith(q)
  ).slice(0, 8);
}

export function CityCombobox({
  value,
  onChange,
  className = "",
  placeholder = "Search city or country\u2026",
  variant = "subtle",
}: Props) {
  const [results, setResults] = useState<CityEntry[]>(getPopularCities());
  const [hasQuery, setHasQuery] = useState(false);
  const isBranded = variant === "branded";

  const handleQueryChange = useCallback((query: string) => {
    setResults(filterCities(query));
    setHasQuery(query.trim().length > 0);
  }, []);

  return (
    <Combobox<CityEntry>
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
        !hasQuery ? (
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
