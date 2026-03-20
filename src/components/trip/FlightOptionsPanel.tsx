"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, Search, AlertTriangle, Filter, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui";
import { useFlightSearch } from "@/hooks/api/flights/useFlightSearch";
import { buildTrackedLink } from "@/lib/affiliate/link-generator";
import { FlightRow } from "./flight/FlightRow";
import { FlightFilterPanel, matchesStopsFilter } from "./flight/FlightFilterPanel";
import type { FlightSearchResult, FlightLegResults } from "@/lib/flights/types";
import type { StopsFilter } from "./flight/FlightFilterPanel";

type SortMode = "price" | "duration";

interface FlightOptionsPanelProps {
  leg: FlightLegResults;
  tripId: string;
  travelers: number;
  itineraryId?: string;
  /** Pre-fetched live results from batch search */
  batchResults?: FlightSearchResult[];
  batchLoading?: boolean;
  batchError?: string | null;
  batchFetchedAt?: number | null;
}

/** Parse "12h 30m" -> total minutes for duration sorting */
function durationToMinutes(d: string): number {
  const h = d.match(/(\d+)h/)?.[1];
  const m = d.match(/(\d+)m/)?.[1];
  return parseInt(h ?? "0") * 60 + parseInt(m ?? "0");
}

export function FlightOptionsPanel({
  leg,
  tripId,
  travelers,
  itineraryId,
  batchResults,
  batchLoading,
  batchError,
  batchFetchedAt,
}: FlightOptionsPanelProps) {
  const [sortMode, setSortMode] = useState<SortMode>("price");
  const [expanded, setExpanded] = useState(false);
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>("any");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Manual per-leg search (refresh button)
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

  // Price range for the slider
  const priceRange = useMemo(() => {
    if (displayResults.length === 0) return { min: 0, max: 1000 };
    const prices = displayResults.map((r) => Math.round(r.price));
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [displayResults]);

  // Apply filters then sort
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

  const buildFilters = (): { nonStop?: boolean; maxPrice?: number } | undefined => {
    const f: { nonStop?: boolean; maxPrice?: number } = {};
    if (stopsFilter === "nonstop") f.nonStop = true;
    if (maxPrice !== null) f.maxPrice = maxPrice;
    return Object.keys(f).length > 0 ? f : undefined;
  };

  const handleLiveSearch = () => {
    searchWithCooldown(leg.fromIata, leg.toIata, leg.departureDate, travelers, buildFilters());
  };

  const handleFilterSearch = (overrides?: {
    stopsFilter?: StopsFilter;
    maxPrice?: number | null;
  }) => {
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
  };

  const clearFilters = () => {
    setStopsFilter("any");
    setMaxPrice(null);
    searchWithCooldown(leg.fromIata, leg.toIata, leg.departureDate, travelers);
  };

  // No results at all — show appropriate message + Skyscanner CTA
  if (displayResults.length === 0 && !loading) {
    const fallbackUrl = buildTrackedLink({
      provider: "skyscanner",
      type: "flight",
      itineraryId,
      dest: `https://www.skyscanner.net/transport/flights/${leg.fromIata}/${leg.toIata}/`,
    });

    return (
      <div className="card-travel bg-background">
        <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
          {leg.fromIata} → {leg.toIata} · {leg.departureDate}
        </div>
        {error && (
          <div className="border-border bg-background mb-3 flex items-start gap-2.5 rounded-lg border p-3">
            <AlertTriangle className="text-accent mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="text-foreground text-sm font-medium">Flight search failed</p>
              <p className="text-muted-foreground mt-0.5 text-xs">{error}</p>
            </div>
          </div>
        )}
        {searchDone && !error && (
          <div className="border-border bg-background mb-3 rounded-lg border p-3">
            <p className="text-foreground text-sm font-medium">No flights found for this route</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              The flight search service didn&apos;t return any results for this leg. This can happen
              when the route isn&apos;t covered or the API is not configured. Try searching on
              Skyscanner instead.
            </p>
          </div>
        )}
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border hover:border-primary hover:bg-primary/5 group block rounded-lg border p-4 text-center transition-all duration-200"
        >
          <div className="mb-1 text-xl">✈️</div>
          <div className="text-foreground text-sm font-medium">Search Flights</div>
          <div className="text-muted-foreground group-hover:text-primary text-xs transition-colors">
            Skyscanner →
          </div>
        </a>
        {!searchDone && (
          <div className="mt-2 flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleLiveSearch} loading={loading}>
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Search live options
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card-travel bg-background">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {leg.fromIata} → {leg.toIata} · {leg.departureDate}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortMode("price")}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                sortMode === "price"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setSortMode("duration")}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                sortMode === "duration"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Duration
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative rounded-md px-2 py-0.5 text-xs transition-colors ${
              showFilters || activeFilterCount > 0
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="mr-1 inline h-3 w-3" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <FlightFilterPanel
          stopsFilter={stopsFilter}
          maxPrice={maxPrice}
          priceRange={priceRange}
          cooldown={cooldown}
          activeFilterCount={activeFilterCount}
          onStopsFilterChange={(filter) => {
            setStopsFilter(filter);
            if (filter === "nonstop" || stopsFilter === "nonstop") {
              handleFilterSearch({ stopsFilter: filter });
            }
          }}
          onMaxPriceChange={setMaxPrice}
          onMaxPriceCommit={(price) => handleFilterSearch({ maxPrice: price })}
          onClearFilters={clearFilters}
        />
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-muted-foreground ml-2 text-sm">Searching flights…</span>
        </div>
      ) : sorted.length === 0 && displayResults.length > 0 ? (
        <div className="py-6 text-center">
          <p className="text-foreground text-sm font-medium">No flights match your filters</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {displayResults.length} result{displayResults.length !== 1 ? "s" : ""} available. Try
            adjusting your filters.
          </p>
          <button
            onClick={clearFilters}
            className="text-primary mt-2 text-xs font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((result, i) => (
            <FlightRow
              key={i}
              result={result}
              bookingHref={buildTrackedLink({
                provider: "skyscanner",
                type: "flight",
                itineraryId,
                dest: result.bookingUrl,
              })}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="border-border bg-background mt-3 flex items-start gap-2.5 rounded-lg border p-3">
          <AlertTriangle className="text-accent mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="text-foreground text-sm font-medium">Flight search failed</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Affiliate booking link — one per leg */}
      {!loading && sorted.length > 0 && (
        <a
          href={buildTrackedLink({
            provider: "skyscanner",
            type: "flight",
            itineraryId,
            dest: sorted[0].bookingUrl,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="border-primary/30 bg-primary/5 hover:bg-primary/10 mt-3 flex items-center justify-center gap-2 rounded-lg border p-2.5 transition-colors"
        >
          <span className="text-primary text-sm font-medium">Book on Skyscanner</span>
          <ExternalLink className="text-primary h-3.5 w-3.5" />
        </a>
      )}

      {/* Footer controls */}
      <div className="mt-3 flex items-center justify-between">
        {hasMore && !loading ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Show {sorted.length - 5} more <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        ) : (
          <span />
        )}
        <Button variant="ghost" size="sm" onClick={handleLiveSearch} loading={manualLoading}>
          <Search className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
