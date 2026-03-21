"use client";

import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plane,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { AlertBox } from "@/components/ui/AlertBox";
import { Button } from "@/components/ui/Button";
import { buildTrackedLink } from "@/lib/features/affiliate/link-generator";
import { FlightRow } from "./flight/FlightRow";
import { FlightFilterPanel } from "./flight/FlightFilterPanel";
import { useFlightOptions } from "./flight/useFlightOptions";
import type { FlightSearchResult, FlightLegResults } from "@/lib/flights/types";

/** Format YYYY-MM-DD → "Oct 12" */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

interface FlightOptionsPanelProps {
  leg: FlightLegResults;
  tripId: string;
  travelers: number;
  itineraryId?: string;
  batchResults?: FlightSearchResult[];
  batchLoading?: boolean;
  batchError?: string | null;
  batchFetchedAt?: number | null;
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
  const {
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
    handleLiveSearch,
    handleFilterSearch,
    clearFilters,
  } = useFlightOptions({
    leg,
    tripId,
    travelers,
    batchResults,
    batchLoading,
    batchError,
    batchFetchedAt,
  });

  const formattedDate = formatDate(leg.departureDate);
  const travelersLabel = `${travelers} traveler${travelers !== 1 ? "s" : ""}`;

  // ── No results at all — show empty state + Skyscanner CTA ──
  if (displayResults.length === 0 && !loading) {
    const fallbackUrl = buildTrackedLink({
      provider: "skyscanner",
      type: "flight",
      itineraryId,
      dest: `https://www.skyscanner.net/transport/flights/${leg.fromIata}/${leg.toIata}/`,
    });

    return (
      <div className="bg-card shadow-card rounded-2xl p-5">
        {/* Context pills */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="bg-surface-soft text-foreground inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
            <span className="text-[10px] font-bold tracking-widest uppercase">{leg.fromIata}</span>
            <Plane className="text-muted-foreground h-3 w-3" />
            <span className="text-[10px] font-bold tracking-widest uppercase">{leg.toIata}</span>
          </span>
          {formattedDate && (
            <span className="bg-surface-soft text-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
              {formattedDate}
            </span>
          )}
        </div>

        {error && (
          <AlertBox
            variant="warning"
            title="Flight search failed"
            description={error}
            className="mb-3"
          />
        )}

        {searchDone && !error && (
          <div className="bg-surface-soft mb-4 rounded-xl p-4 text-center">
            <p className="text-foreground text-sm font-medium">No flights found for this route</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Try searching on Skyscanner instead.
            </p>
          </div>
        )}

        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-surface-soft hover:bg-surface-hover group block rounded-xl p-5 text-center transition-all"
        >
          <Plane className="text-primary/30 mx-auto mb-2 h-8 w-8" />
          <div className="text-foreground text-sm font-semibold">Search on Skyscanner</div>
          <div className="text-muted-foreground group-hover:text-primary mt-0.5 text-xs transition-colors">
            Find flights for this route &rarr;
          </div>
        </a>

        {!searchDone && (
          <div className="mt-3 flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleLiveSearch} loading={loading}>
              Search live options
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Main results view ──
  return (
    <div className="bg-card shadow-card rounded-2xl p-5">
      {/* Context pills row */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto">
        <span className="bg-surface-soft text-foreground inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm">
          <span className="text-[10px] font-bold tracking-widest uppercase">{leg.fromIata}</span>
          <Plane className="text-muted-foreground h-3 w-3" />
          <span className="text-[10px] font-bold tracking-widest uppercase">{leg.toIata}</span>
        </span>
        {formattedDate && (
          <span className="bg-surface-soft text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm">
            {formattedDate}
          </span>
        )}
        <span className="bg-surface-soft text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm">
          {travelersLabel}
        </span>
        {/* Filter icon button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`ml-auto flex shrink-0 items-center justify-center rounded-full p-2 transition-colors ${
            showFilters || activeFilterCount > 0
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-soft"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Results summary + sort tabs */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">
          {sorted.length} result{sorted.length !== 1 ? "s" : ""} found
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setSortMode("price")}
            className={`text-[11px] font-bold tracking-widest uppercase transition-colors ${
              sortMode === "price"
                ? "text-primary"
                : "text-muted-foreground/40 hover:text-muted-foreground"
            }`}
          >
            Cheapest
          </button>
          <button
            onClick={() => setSortMode("duration")}
            className={`text-[11px] font-bold tracking-widest uppercase transition-colors ${
              sortMode === "duration"
                ? "text-primary"
                : "text-muted-foreground/40 hover:text-muted-foreground"
            }`}
          >
            Quickest
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
        /* Skeleton loading cards */
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-secondary animate-pulse rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-muted h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-5 w-32 rounded" />
                  <div className="bg-muted h-3 w-24 rounded" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="bg-muted ml-auto h-6 w-16 rounded" />
                  <div className="bg-muted ml-auto h-3 w-12 rounded" />
                </div>
              </div>
              <div className="border-muted mt-3 flex items-center justify-between border-t pt-3">
                <div className="flex gap-2">
                  <div className="bg-muted h-5 w-16 rounded-full" />
                  <div className="bg-muted h-5 w-14 rounded-full" />
                </div>
                <div className="bg-muted h-8 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 && displayResults.length > 0 ? (
        <div className="py-8 text-center">
          <Plane className="text-primary/20 mx-auto mb-3 h-10 w-10" />
          <p className="text-foreground text-sm font-semibold">No flights match your filters</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {displayResults.length} result{displayResults.length !== 1 ? "s" : ""} available.
          </p>
          <button
            onClick={clearFilters}
            className="text-primary mt-3 text-xs font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((result, i) => (
            <FlightRow
              key={i}
              result={result}
              fromIata={leg.fromIata}
              toIata={leg.toIata}
              departureDate={leg.departureDate}
              tripId={tripId}
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
        <AlertBox
          variant="warning"
          title="Flight search failed"
          description={error}
          className="mt-4"
        />
      )}

      {/* Skyscanner affiliate CTA */}
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
          className="bg-surface-soft hover:bg-surface-hover mt-4 flex items-center justify-center gap-2 rounded-xl p-3 transition-colors"
        >
          <span className="text-primary text-sm font-medium">Book on Skyscanner</span>
          <ExternalLink className="text-primary h-3.5 w-3.5" />
        </a>
      )}

      {/* Footer controls */}
      <div className="mt-4 flex items-center justify-between">
        {hasMore && !loading ? (
          <Button
            variant="ghost"
            size="sm"
            fullWidth={false}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Show {sorted.length - 5} more flights <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        ) : (
          <span />
        )}
        <button
          onClick={handleLiveSearch}
          disabled={manualLoading}
          className="text-muted-foreground hover:text-primary hover:bg-surface-soft rounded-full p-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${manualLoading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
