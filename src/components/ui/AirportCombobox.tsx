"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AIRPORTS } from "@/data/airports-full";
import { inputClass } from "@/components/auth/auth-styles";

interface Props {
  value: string; // stored as "FRA – Frankfurt am Main, DE"
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  variant?: "default" | "v2";
}

/** Format an airport entry into the canonical label stored in the Zustand store */
function toLabel(iata: string, name: string, city: string, country: string): string {
  const display = city ? `${city}, ${country}` : country;
  return `${iata} – ${name} (${display})`;
}

/** Filter airports by query — matches IATA, city, or airport name */
function filterAirports(query: string) {
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
  placeholder = "Search airport or city…",
  variant = "default",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = filterAirports(query);
  const isV2 = variant === "v2";

  // Derive display label from stored value (show it when input is not focused)
  const displayValue = value ? value.split("(")[0].trim() : "";

  const select = useCallback(
    (iata: string, name: string, city: string, country: string) => {
      onChange(toLabel(iata, name, city, country));
      setQuery("");
      setOpen(false);
    },
    [onChange]
  );

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[highlighted];
      if (r) select(r.iata, r.name, r.city, r.country);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        spellCheck={false}
        className={`${inputClass} ${className}`}
        placeholder={!open && value ? "" : placeholder}
        value={open ? query : ""}
        onFocus={() => {
          setOpen(true);
          setHighlighted(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlighted(0);
        }}
        onKeyDown={handleKeyDown}
      />
      {/* Show current selection when not focused */}
      {!open && value && (
        <div className="pointer-events-none absolute inset-0 flex items-center px-4">
          <span className={`${isV2 ? "text-v2-navy" : "text-foreground"} truncate text-sm`}>
            {displayValue}
          </span>
        </div>
      )}

      {open && results.length > 0 && (
        <ul
          className={`absolute z-50 w-full overflow-hidden overflow-y-auto border ${
            isV2
              ? "border-v2-border mt-2 max-h-[min(18rem,52vh)] rounded-2xl bg-white shadow-[0_18px_40px_rgba(27,43,75,0.12)]"
              : "bg-background border-border mt-1 max-h-[min(16rem,50vh)] rounded-lg shadow-lg"
          }`}
        >
          {results.map((a, i) => (
            <li
              key={a.iata}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isV2
                  ? i === highlighted
                    ? "bg-v2-chip-bg text-v2-navy"
                    : "text-v2-navy hover:bg-v2-chip-bg"
                  : i === highlighted
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(a.iata, a.name, a.city, a.country);
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span
                className={`w-9 shrink-0 font-mono font-semibold ${
                  isV2 ? "text-v2-orange" : "text-primary"
                }`}
              >
                {a.iata}
              </span>
              <span className={`${isV2 ? "text-v2-navy" : "text-foreground"} truncate`}>
                {a.name}
              </span>
              <span
                className={`ml-auto shrink-0 ${
                  isV2 ? "text-v2-text-muted" : "text-muted-foreground"
                }`}
              >
                {a.city ? `${a.city}, ${a.country}` : a.country}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div
          className={`absolute z-50 w-full border px-4 py-3 text-sm ${
            isV2
              ? "border-v2-border text-v2-text-muted mt-2 rounded-2xl bg-white shadow-[0_18px_40px_rgba(27,43,75,0.12)]"
              : "bg-background border-border text-muted-foreground mt-1 rounded-lg shadow-lg"
          }`}
        >
          No airports found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
