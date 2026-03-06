"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Search, ExternalLink, AlertTriangle, Filter } from "lucide-react";
import { Button } from "@/components/ui";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { buildTrackedLink } from "@/lib/affiliate/link-generator";
import type { FlightSearchResult, FlightLegResults } from "@/lib/flights/types";

type SortMode = "price" | "duration";
type StopsFilter = "any" | "nonstop" | "1stop" | "2plus";

interface FlightOptionsPanelProps {
  leg: FlightLegResults;
  tripId: string;
  travelers: number;
  itineraryId?: string;
}

/** Parse "12h 30m" -> total minutes for duration sorting */
function durationToMinutes(d: string): number {
  const h = d.match(/(\d+)h/)?.[1];
  const m = d.match(/(\d+)m/)?.[1];
  return parseInt(h ?? "0") * 60 + parseInt(m ?? "0");
}

/** Format ISO time -> "08:30" */
function formatTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

function StopsLabel({ stops }: { stops: number }) {
  if (stops === 0) return <span className="text-green-600 dark:text-green-400">Nonstop</span>;
  return (
    <span className="text-amber-600 dark:text-amber-400">
      {stops} stop{stops > 1 ? "s" : ""}
    </span>
  );
}

function FlightRow({ result, itineraryId }: { result: FlightSearchResult; itineraryId?: string }) {
  const trackedUrl = buildTrackedLink({
    provider: "skyscanner",
    type: "flight",
    itineraryId,
    dest: result.bookingUrl,
  });

  return (
    <a
      href={trackedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="border-border hover:border-primary hover:bg-primary/5 group flex items-center justify-between rounded-lg border p-3 transition-all duration-200"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-base">✈️</span>
        <div className="min-w-0">
          <div className="text-foreground flex items-center gap-2 text-sm font-medium">
            <span>{result.airline}</span>
            <span className="text-muted-foreground">·</span>
            <StopsLabel stops={result.stops} />
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{result.duration}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {formatTime(result.departureTime)}
            {result.arrivalTime && ` → ${formatTime(result.arrivalTime)}`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-right">
        <div>
          <div className="text-foreground text-sm font-bold">
            €{Math.round(result.price).toLocaleString()}
          </div>
          <div className="text-muted-foreground group-hover:text-primary text-xs transition-colors">
            Book <ExternalLink className="mb-0.5 inline h-3 w-3" />
          </div>
        </div>
      </div>
    </a>
  );
}

const STOPS_OPTIONS: { value: StopsFilter; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "nonstop", label: "Nonstop" },
  { value: "1stop", label: "1 stop" },
  { value: "2plus", label: "2+" },
];

function matchesStopsFilter(stops: number, filter: StopsFilter): boolean {
  switch (filter) {
    case "nonstop":
      return stops === 0;
    case "1stop":
      return stops <= 1;
    case "2plus":
      return true; // show all — it's a "max" filter
    default:
      return true;
  }
}

export function FlightOptionsPanel({
  leg,
  tripId,
  travelers,
  itineraryId,
}: FlightOptionsPanelProps) {
  const [sortMode, setSortMode] = useState<SortMode>("price");
  const [expanded, setExpanded] = useState(false);
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>("any");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const {
    results: liveResults,
    loading,
    error,
    search,
    fetchedAt: liveFetchedAt,
  } = useFlightSearch(tripId);

  // Use live results if available, otherwise prefetched
  const hasLive = liveResults.length > 0 || liveFetchedAt !== null;
  const displayResults = hasLive ? liveResults : leg.results;

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

  const handleLiveSearch = () => {
    void search(leg.fromIata, leg.toIata, leg.departureDate, travelers);
  };

  const clearFilters = () => {
    setStopsFilter("any");
    setMaxPrice(null);
  };

  // No results at all — show appropriate message + Skyscanner CTA
  if (displayResults.length === 0 && !loading) {
    const liveSearchDone = liveFetchedAt !== null;
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
        {liveSearchDone && (
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
        {!liveSearchDone && (
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
        <div className="border-border bg-background mb-3 space-y-3 rounded-lg border p-3">
          {/* Stops filter */}
          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">Stops</label>
            <div className="flex flex-wrap gap-1.5">
              {STOPS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStopsFilter(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    stopsFilter === opt.value
                      ? "bg-primary font-medium text-white"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max price filter */}
          {priceRange.min < priceRange.max && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-muted-foreground text-xs font-medium">Max price</label>
                <span className="text-foreground text-xs font-medium">
                  {maxPrice !== null
                    ? `€${maxPrice.toLocaleString()}`
                    : `€${priceRange.max.toLocaleString()}`}
                </span>
              </div>
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                step={10}
                value={maxPrice ?? priceRange.max}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setMaxPrice(val >= priceRange.max ? null : val);
                }}
                className="accent-primary w-full"
              />
              <div className="text-muted-foreground mt-0.5 flex justify-between text-[10px]">
                <span>€{priceRange.min.toLocaleString()}</span>
                <span>€{priceRange.max.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-primary text-xs font-medium hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
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
            <FlightRow key={i} result={result} itineraryId={itineraryId} />
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
        <Button variant="ghost" size="sm" onClick={handleLiveSearch} loading={loading}>
          <Search className="mr-1.5 h-3.5 w-3.5" />
          Search live options
        </Button>
      </div>
    </div>
  );
}
