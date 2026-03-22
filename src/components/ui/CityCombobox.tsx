"use client";

import { CITIES, type CityEntry } from "@/data/cities";
import { Combobox } from "./Combobox";
import { useCombobox } from "./useCombobox";

interface Props {
  value: string; // stored as "Tokyo, Japan"
  onChange: (entry: CityEntry) => void;
  className?: string;
  placeholder?: string;
  variant?: "subtle" | "branded";
}

const filterCities = (query: string): CityEntry[] => {
  const q = query.toLowerCase().trim();
  if (!q) return CITIES.filter((c) => c.popular);
  return CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.countryCode.toLowerCase().startsWith(q)
  ).slice(0, 8);
};

export function CityCombobox({
  value,
  onChange,
  className = "",
  placeholder = "Search city or country\u2026",
  variant = "subtle",
}: Props) {
  const { results, hasQuery, handleQueryChange } = useCombobox({ filter: filterCities });
  const isBranded = variant === "branded";

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
