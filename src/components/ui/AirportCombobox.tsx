"use client";

import { useState, useCallback } from "react";
import { AIRPORTS } from "@/data/airports-full";
import { Combobox } from "./Combobox";

type AirportEntry = (typeof AIRPORTS)[number];

interface Props {
  value: string; // stored as "FRA – Frankfurt am Main, DE"
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  variant?: "default" | "v2";
}

/** Format an airport entry into the canonical label stored in the Zustand store */
function toLabel(a: AirportEntry): string {
  const display = a.city ? `${a.city}, ${a.country}` : a.country;
  return `${a.iata} \u2013 ${a.name} (${display})`;
}

/** Filter airports by query — matches IATA, city, or airport name */
function filterAirports(query: string): AirportEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return AIRPORTS.filter(
    (a) =>
      a.iata.toLowerCase().startsWith(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
  ).slice(0, 8);
}

export function AirportCombobox({
  value,
  onChange,
  className = "",
  placeholder = "Search airport or city\u2026",
  variant = "default",
}: Props) {
  const [results, setResults] = useState<AirportEntry[]>([]);
  const isV2 = variant === "v2";

  // Derive display label from stored value (show it when input is not focused)
  const displayValue = value ? value.split("(")[0].trim() : "";

  const handleQueryChange = useCallback((query: string) => {
    setResults(filterAirports(query));
  }, []);

  const handleSelect = useCallback(
    (a: AirportEntry) => {
      onChange(toLabel(a));
    },
    [onChange]
  );

  return (
    <Combobox<AirportEntry>
      value={value}
      displayValue={displayValue}
      results={results}
      onQueryChange={handleQueryChange}
      onSelect={handleSelect}
      getKey={(a) => a.iata}
      placeholder={placeholder}
      className={className}
      variant={variant}
      emptyMessage={(q) => <>No airports found for &ldquo;{q}&rdquo;</>}
      renderItem={(a) => (
        <>
          <span
            className={`w-9 shrink-0 font-mono font-semibold ${
              isV2 ? "text-brand-primary" : "text-primary"
            }`}
          >
            {a.iata}
          </span>
          <span className={`${isV2 ? "text-v2-navy" : "text-foreground"} truncate`}>{a.name}</span>
          <span
            className={`ml-auto shrink-0 ${isV2 ? "text-v2-text-muted" : "text-muted-foreground"}`}
          >
            {a.city ? `${a.city}, ${a.country}` : a.country}
          </span>
        </>
      )}
    />
  );
}
