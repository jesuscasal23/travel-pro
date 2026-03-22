"use client";

import { useState, useCallback } from "react";

interface UseComboboxOptions<T> {
  /** Filter/search the dataset. Called on every keystroke and on focus. */
  filter: (query: string) => T[];
  /** Initial results shown when query is empty (e.g. popular items). Defaults to filter(""). */
  initialResults?: T[];
}

interface UseComboboxReturn<T> {
  results: T[];
  hasQuery: boolean;
  handleQueryChange: (query: string) => void;
}

/**
 * Shared state logic for Combobox wrappers (city, country, airport, etc.).
 * Manages filtered results and query tracking so each wrapper only needs to
 * provide its dataset, filter function, and renderItem.
 */
export function useCombobox<T>({
  filter,
  initialResults,
}: UseComboboxOptions<T>): UseComboboxReturn<T> {
  const [results, setResults] = useState<T[]>(() => initialResults ?? filter(""));
  const [hasQuery, setHasQuery] = useState(false);

  const handleQueryChange = useCallback(
    (query: string) => {
      setResults(filter(query));
      setHasQuery(query.trim().length > 0);
    },
    [filter]
  );

  return { results, hasQuery, handleQueryChange };
}
