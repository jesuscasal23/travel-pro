"use client";

import { useCallback } from "react";
import { AIRPORTS } from "@/data/airports-full";
import { Combobox } from "./Combobox";
import { useCombobox } from "./useCombobox";

type AirportEntry = (typeof AIRPORTS)[number];

interface Props {
  value: string; // stored as "FRA – Frankfurt am Main, DE"
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  variant?: "subtle" | "branded";
}

/** Format an airport entry into the canonical label stored in the Zustand store */
function toLabel(a: AirportEntry): string {
  const display = a.city ? `${a.city}, ${a.country}` : a.country;
  return `${a.iata} \u2013 ${a.name} (${display})`;
}

const filterAirports = (query: string): AirportEntry[] => {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return AIRPORTS.filter(
    (a) =>
      a.iata.toLowerCase().startsWith(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
  ).slice(0, 8);
};

export function AirportCombobox({
  value,
  onChange,
  className = "",
  placeholder = "Search airport or city\u2026",
  variant = "subtle",
}: Props) {
  const { results, handleQueryChange } = useCombobox({
    filter: filterAirports,
    initialResults: [],
  });
  const isBranded = variant === "branded";

  const displayValue = value ? value.split("(")[0].trim() : "";

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
              isBranded ? "text-brand-primary" : "text-primary"
            }`}
          >
            {a.iata}
          </span>
          <span className={`${isBranded ? "text-navy" : "text-foreground"} truncate`}>
            {a.name}
          </span>
          <span className={`ml-auto shrink-0 ${isBranded ? "text-dim" : "text-muted-foreground"}`}>
            {a.city ? `${a.city}, ${a.country}` : a.country}
          </span>
        </>
      )}
    />
  );
}
