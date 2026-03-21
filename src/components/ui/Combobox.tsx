"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { inputClass } from "./styles";

export interface ComboboxProps<T> {
  /** Display value shown when the input is not focused */
  value: string;
  /** Filtered results to display in the dropdown */
  results: T[];
  /** Called when the user types in the input */
  onQueryChange: (query: string) => void;
  /** Called when the user selects an item from the dropdown */
  onSelect: (item: T) => void;
  /** Render a single dropdown item */
  renderItem: (item: T, isHighlighted: boolean) => ReactNode;
  /** Extract a unique key for each item */
  getKey: (item: T) => string;
  /** Placeholder shown when no value is selected */
  placeholder?: string;
  /** Additional class names for the input element */
  className?: string;
  /** Message shown when no results match (requires minCharsForEmpty chars typed).
   *  Pass a string for static text, or a function receiving the current query. */
  emptyMessage?: ReactNode | ((query: string) => ReactNode);
  /** Minimum query length before showing the empty message (default: 2) */
  minCharsForEmpty?: number;
  /** Optional header rendered at the top of the dropdown (e.g. "Popular destinations") */
  listHeader?: ReactNode;
  /** Visual variant */
  variant?: "default" | "v2";
  /** Optional override for the display value shown when not focused */
  displayValue?: string;
}

export function Combobox<T>({
  value,
  results,
  onQueryChange,
  onSelect,
  renderItem,
  getKey,
  placeholder = "Search\u2026",
  className = "",
  emptyMessage,
  minCharsForEmpty = 2,
  listHeader,
  variant = "default",
  displayValue,
}: ComboboxProps<T>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isV2 = variant === "v2";
  const shownValue = displayValue ?? value;

  const select = useCallback(
    (item: T) => {
      onSelect(item);
      setQuery("");
      setOpen(false);
    },
    [onSelect]
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

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setHighlighted(0);
    onQueryChange(val);
  }

  function handleFocus() {
    setOpen(true);
    setHighlighted(0);
    // Re-trigger query with current value so parent can provide initial results
    onQueryChange(query);
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
        onFocus={handleFocus}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      {/* Show current selection when not focused */}
      {!open && value && (
        <div className="pointer-events-none absolute inset-0 flex items-center px-4">
          <span className={`${isV2 ? "text-v2-navy" : "text-foreground"} truncate text-sm`}>
            {shownValue}
          </span>
        </div>
      )}

      {open && results.length > 0 && (
        <ul
          className={`absolute z-50 w-full overflow-hidden overflow-y-auto border ${
            isV2
              ? "border-v2-border shadow-glass-lg mt-2 max-h-[min(18rem,52vh)] rounded-2xl bg-white"
              : "bg-background border-border mt-1 max-h-[min(16rem,50vh)] rounded-lg shadow-lg"
          }`}
        >
          {listHeader}
          {results.map((item, i) => (
            <li
              key={getKey(item)}
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
                select(item);
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              {renderItem(item, i === highlighted)}
            </li>
          ))}
        </ul>
      )}

      {open && query.length >= minCharsForEmpty && results.length === 0 && emptyMessage && (
        <div
          className={`absolute z-50 w-full border px-4 py-3 text-sm ${
            isV2
              ? "border-v2-border text-v2-text-muted shadow-glass-lg mt-2 rounded-2xl bg-white"
              : "bg-background border-border text-muted-foreground mt-1 rounded-lg shadow-lg"
          }`}
        >
          {typeof emptyMessage === "function" ? emptyMessage(query) : emptyMessage}
        </div>
      )}
    </div>
  );
}
