"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CITIES } from "@/data/cities";
import { inputClass } from "@/components/auth/auth-styles";

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
  variant?: "default" | "v2";
}

function getPopularCountries(): CountryEntry[] {
  return COUNTRIES.filter((c) => c.popular);
}

function filterCountries(query: string): CountryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return getPopularCountries();
  return COUNTRIES.filter(
    (c) => c.country.toLowerCase().includes(q) || c.countryCode.toLowerCase().startsWith(q)
  ).slice(0, 8);
}

export function CountryCombobox({
  value,
  onChange,
  className = "",
  placeholder = "Search country\u2026",
  variant = "default",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = filterCountries(query);
  const isV2 = variant === "v2";

  const select = useCallback(
    (entry: CountryEntry) => {
      onChange(entry);
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
      if (r) select(r);
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
            {value}
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
          {!query && (
            <li
              className={`border-b px-4 py-1.5 text-xs font-medium ${
                isV2
                  ? "border-v2-border text-v2-text-muted bg-v2-chip-bg"
                  : "text-muted-foreground border-border"
              }`}
            >
              Popular countries
            </li>
          )}
          {results.map((c, i) => (
            <li
              key={c.countryCode}
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
                select(c);
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span className={`${isV2 ? "text-v2-navy" : "text-foreground"} truncate font-medium`}>
                {c.country}
              </span>
              <span
                className={`ml-auto w-6 shrink-0 font-mono text-xs ${
                  isV2 ? "text-v2-text-light" : "text-muted-foreground/60"
                }`}
              >
                {c.countryCode}
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
          No countries found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
