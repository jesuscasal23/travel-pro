"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useFlightSearch } from "@/hooks/api/flights/useFlightSearch";
import { matchesStopsFilter } from "./FlightFilterPanel";
import type { FlightSearchResult, FlightLegResults } from "@/lib/flights/types";
import type { StopsFilter } from "./FlightFilterPanel";

type SortMode = "price" | "duration";

/** Parse "12h 30m" -> total minutes for duration sorting */
function durationToMinutes(d: string): number {
  const h = d.match(/(\d+)h/)?.[1];
  const m = d.match(/(\d+)m/)?.[1];
  return parseInt(h ?? "0") * 60 + parseInt(m ?? "0");
}

interface UseFlightOptionsParams {
  leg: FlightLegResults;
  tripId: string;
  travelers: number;
  batchResults?: FlightSearchResult[];
  batchLoading?: boolean;
  batchError?: string | null;
  batchFetchedAt?: number | null;
}

export function useFlightOptions({
  leg,
  tripId,
  travelers,
  batchResults,
  batchLoading,
  batchError,
  batchFetchedAt,
}: UseFlightOptionsParams) {
  const [sortMode, setSortMode] = useState<SortMode>("price");
  const [expanded, setExpanded] = useState(false);
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>("any");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    results: manualResults,
    loading: manualLoading,
    error: manualError,
    search,
    fetchedAt: manualFetchedAt,
  } = useFlightSearch(tripId);

  // Cooldown: prevent rapid-fire filter fetches (2s between calls)
  const [cooldown, setCooldown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchWithCooldown = useCallback(
    (...args: Parameters<typeof search>) => {
      void search(...args);
      setCooldown(true);
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      cooldownTimer.current = setTimeout(() => setCooldown(false), 2000);
    },
    [search]
  );

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) {
        clearTimeout(cooldownTimer.current);
        cooldownTimer.current = null;
      }
    };
  }, []);

  // Priority: manual search > batch search > prefetched
  const hasManual =
    manualResults.length > 0 || manualFetchedAt !== null || manualLoading || manualError !== null;
  const hasBatch =
    (batchResults && batchResults.length > 0) || (batchFetchedAt != null && batchFetchedAt > 0);

  let displayResults: FlightSearchResult[];
  let loading: boolean;
  let error: string | null;
  let searchDone: boolean;

  if (hasManual) {
    displayResults = manualResults;
    loading = manualLoading;
    error = manualError;
    searchDone = manualFetchedAt !== null;
  } else if (hasBatch) {
    displayResults = batchResults ?? [];
    loading = batchLoading ?? false;
    error = batchError ?? null;
    searchDone = batchFetchedAt !== null;
  } else {
    displayResults = leg.results;
    loading = false;
    error = null;
    searchDone = false;
  }

  const priceRange = useMemo(() => {
    if (displayResults.length === 0) return { min: 0, max: 1000 };
    const prices = displayResults.map((r) => Math.round(r.price));
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [displayResults]);

  const filtered = useMemo(() => {
    return displayResults.filter((r) => {
      if (!matchesStopsFilter(r.stops, stopsFilter)) return false;
      if (maxPrice !== null && r.price > maxPrice) return false;
      return true;
    });
  }, [displayResults, stopsFilter, maxPrice]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortMode === "duration") {
      copy.sort((a, b) => durationToMinutes(a.duration) - durationToMinutes(b.duration));
    } else {
      copy.sort((a, b) => a.price - b.price);
    }
    return copy;
  }, [filtered, sortMode]);

  const visible = expanded ? sorted : sorted.slice(0, 5);
  const hasMore = sorted.length > 5;
  const activeFilterCount = (stopsFilter !== "any" ? 1 : 0) + (maxPrice !== null ? 1 : 0);

  const handleLiveSearch = useCallback(() => {
    const f: { nonStop?: boolean; maxPrice?: number } = {};
    if (stopsFilter === "nonstop") f.nonStop = true;
    if (maxPrice !== null) f.maxPrice = maxPrice;
    searchWithCooldown(
      leg.fromIata,
      leg.toIata,
      leg.departureDate,
      travelers,
      Object.keys(f).length > 0 ? f : undefined
    );
  }, [searchWithCooldown, leg, travelers, stopsFilter, maxPrice]);

  const handleFilterSearch = useCallback(
    (overrides?: { stopsFilter?: StopsFilter; maxPrice?: number | null }) => {
      if (cooldown) return;
      const stops = overrides?.stopsFilter ?? stopsFilter;
      const price = overrides?.maxPrice !== undefined ? overrides.maxPrice : maxPrice;
      const f: { nonStop?: boolean; maxPrice?: number } = {};
      if (stops === "nonstop") f.nonStop = true;
      if (price !== null) f.maxPrice = price;
      searchWithCooldown(
        leg.fromIata,
        leg.toIata,
        leg.departureDate,
        travelers,
        Object.keys(f).length > 0 ? f : undefined
      );
    },
    [cooldown, stopsFilter, maxPrice, searchWithCooldown, leg, travelers]
  );

  const clearFilters = useCallback(() => {
    setStopsFilter("any");
    setMaxPrice(null);
    searchWithCooldown(leg.fromIata, leg.toIata, leg.departureDate, travelers);
  }, [searchWithCooldown, leg, travelers]);

  return {
    // State
    sortMode,
    setSortMode,
    expanded,
    setExpanded,
    stopsFilter,
    setStopsFilter,
    maxPrice,
    setMaxPrice,
    showFilters,
    setShowFilters,
    // Computed
    displayResults,
    loading,
    manualLoading,
    error,
    searchDone,
    priceRange,
    sorted,
    visible,
    hasMore,
    activeFilterCount,
    cooldown,
    // Actions
    handleLiveSearch,
    handleFilterSearch,
    clearFilters,
  };
}
