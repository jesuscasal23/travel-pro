"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CITIES, type CityEntry } from "@/data/cities";
import { inputClass } from "@/components/auth/auth-styles";

interface Props {
  value: string; // stored as "Tokyo, Japan"
  onChange: (entry: CityEntry) => void;
  className?: string;
  placeholder?: string;
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
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = filterCities(query);

  const select = useCallback(
    (entry: CityEntry) => {
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
          <span className="text-foreground truncate text-sm">{value}</span>
        </div>
      )}

      {open && results.length > 0 && (
        <ul className="bg-background border-border absolute z-50 mt-1 max-h-[min(16rem,50vh)] w-full overflow-hidden overflow-y-auto rounded-lg border shadow-lg">
          {!query && (
            <li className="text-muted-foreground border-border border-b px-4 py-1.5 text-xs font-medium">
              Popular destinations
            </li>
          )}
          {results.map((c, i) => (
            <li
              key={`${c.countryCode}-${c.city}`}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                i === highlighted ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(c);
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span className="text-foreground truncate font-medium">{c.city}</span>
              <span className="text-muted-foreground ml-auto shrink-0">{c.country}</span>
              <span className="text-muted-foreground/60 w-6 shrink-0 font-mono text-xs">
                {c.countryCode}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="bg-background border-border text-muted-foreground absolute z-50 mt-1 w-full rounded-lg border px-4 py-3 text-sm shadow-lg">
          No cities found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
