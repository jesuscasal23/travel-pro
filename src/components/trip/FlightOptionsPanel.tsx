"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Plane,
  RefreshCw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { AlertBox } from "@/components/ui/AlertBox";
import { Button } from "@/components/ui/Button";
import { buildTrackedLink } from "@/lib/features/affiliate/link-generator";
import { getAirlineName } from "@/lib/flights/airlines";
import { FlightRow } from "./flight/FlightRow";
import { FlightFilterPanel } from "./flight/FlightFilterPanel";
import { useFlightOptions } from "./flight/useFlightOptions";
import type { FlightSearchResult, FlightLegResults } from "@/lib/flights/types";
import type { BookingClick, FlightDirection, FlightSelection } from "@/types";
import { AffiliateEvents } from "@/lib/analytics/events";

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

/** Format ISO time -> "08:30" */
function formatTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

interface FlightOptionsPanelProps {
  leg: FlightLegResults;
  tripId: string;
  itineraryId?: string;
  direction?: FlightDirection;
  batchResults?: FlightSearchResult[];
  batchLoading?: boolean;
  batchError?: string | null;
  batchFetchedAt?: number | null;
  bookingClick?: BookingClick;
  onConfirmBooking?: (clickId: string, confirmed: boolean) => void;
  selectedFlight?: FlightSelection;
  onSelectFlight?: (result: FlightSearchResult) => void;
  onSelectManual?: () => void;
  onRemoveSelection?: () => void;
}

export function FlightOptionsPanel({
  leg,
  tripId,
  itineraryId,
  batchResults,
  batchLoading,
  batchError,
  batchFetchedAt,
  direction,
  bookingClick,
  onConfirmBooking,
  selectedFlight,
  onSelectFlight,
  onSelectManual,
  onRemoveSelection,
}: FlightOptionsPanelProps) {
  const [showResults, setShowResults] = useState(!selectedFlight);
  const posthog = usePostHog();
  const affiliateImpressionRef = useRef<string | null>(null);

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
    travelers: 1,
    batchResults,
    batchLoading,
    batchError,
    batchFetchedAt,
  });

  const formattedDate = formatDate(leg.departureDate);

  // ── Booking confirmation prompt ──
  const bookingConfirmation =
    bookingClick && bookingClick.bookingConfirmed === null && onConfirmBooking ? (
      <div className="dark:bg-card mb-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
        <Plane className="text-primary h-4 w-4 shrink-0" />
        <p className="text-foreground flex-1 text-xs font-medium">Did you book this flight?</p>
        <button
          onClick={() => onConfirmBooking(bookingClick.id, true)}
          className="bg-app-green/10 text-app-green hover:bg-app-green/20 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          aria-label="Yes, I booked this flight"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onConfirmBooking(bookingClick.id, false)}
          className="bg-app-red/10 text-app-red hover:bg-app-red/20 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          aria-label="No, I did not book this flight"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ) : bookingClick && bookingClick.bookingConfirmed === true ? (
      <div className="dark:bg-card mb-4 flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
        <div className="bg-app-green/10 flex h-5 w-5 items-center justify-center rounded-full">
          <Check className="text-app-green h-3 w-3" />
        </div>
        <p className="text-muted-foreground text-xs font-medium">Flight booked</p>
      </div>
    ) : null;

  // ── Selected flight compact card ──
  const selectedCard = selectedFlight ? (
    <div className="ring-app-green/30 dark:bg-card mb-4 rounded-xl bg-white p-4 shadow-sm ring-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-4">
          <div className="bg-secondary flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg p-2">
            <span className="text-foreground text-xs font-bold">{selectedFlight.airline}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              {selectedFlight.departureTime || selectedFlight.arrivalTime ? (
                <>
                  {selectedFlight.departureTime && (
                    <span className="font-display text-foreground text-lg font-bold">
                      {formatTime(selectedFlight.departureTime)}
                    </span>
                  )}
                  {selectedFlight.departureTime && selectedFlight.arrivalTime && (
                    <ArrowRight className="text-muted-foreground/50 h-3.5 w-3.5" />
                  )}
                  {selectedFlight.arrivalTime && (
                    <span className="font-display text-foreground text-lg font-bold">
                      {formatTime(selectedFlight.arrivalTime)}
                    </span>
                  )}
                </>
              ) : (
                <span className="font-display text-foreground text-lg font-bold">
                  {getAirlineName(selectedFlight.airline)}
                </span>
              )}
            </div>
            <span className="text-muted-foreground text-[11px] font-medium">
              {selectedFlight.fromIata} - {selectedFlight.toIata} &middot;{" "}
              {selectedFlight.stops === 0
                ? "Non-stop"
                : `${selectedFlight.stops} Stop${selectedFlight.stops > 1 ? "s" : ""}`}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-foreground text-xl font-bold">
            &euro;{Math.round(selectedFlight.price).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="border-secondary mt-3 flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-3">
          <span className="bg-app-green/10 text-app-green inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold">
            <Check className="h-3 w-3" /> Selected
          </span>
          <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <Clock className="h-3.5 w-3.5" /> {selectedFlight.duration}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResults(true)}
            className="text-primary text-[11px] font-semibold hover:underline"
          >
            Change
          </button>
          {onRemoveSelection && (
            <button
              onClick={onRemoveSelection}
              className="text-muted-foreground hover:text-app-red text-[11px] font-medium transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  const flightMeta = {
    type: "flight" as const,
    fromIata: leg.fromIata,
    toIata: leg.toIata,
    departureDate: leg.departureDate,
    ...(direction && { direction }),
  };
  const legKey = `${leg.fromIata}-${leg.toIata}-${leg.departureDate}`;
  const affiliatePlacement: "empty_state" | "footer" | null =
    !loading && displayResults.length === 0
      ? "empty_state"
      : !loading && sorted.length > 0
        ? "footer"
        : null;

  useEffect(() => {
    if (!affiliatePlacement) return;
    const key = `${legKey}-${affiliatePlacement}`;
    if (affiliateImpressionRef.current === key) return;
    affiliateImpressionRef.current = key;
    posthog?.capture(AffiliateEvents.CardShown, {
      provider: "skyscanner",
      click_type: "flight",
      placement: affiliatePlacement,
      trip_id: tripId,
      from_iata: leg.fromIata,
      to_iata: leg.toIata,
      departure_date: leg.departureDate,
    });
  }, [affiliatePlacement, legKey, leg.departureDate, leg.fromIata, leg.toIata, posthog, tripId]);

  const handleAffiliateClick = (placement: "empty_state" | "footer") => {
    posthog?.capture(AffiliateEvents.LinkClicked, {
      provider: "skyscanner",
      click_type: "flight",
      placement,
      trip_id: tripId,
      from_iata: leg.fromIata,
      to_iata: leg.toIata,
      departure_date: leg.departureDate,
    });
    onSelectManual?.();
  };

  // ── No results at all — show empty state + Skyscanner CTA ──
  if (displayResults.length === 0 && !loading) {
    const fallbackUrl = buildTrackedLink({
      provider: "skyscanner",
      type: "flight",
      itineraryId,
      dest: `https://www.skyscanner.net/transport/flights/${leg.fromIata}/${leg.toIata}/`,
      metadata: { ...flightMeta, placement: "empty_state" },
    });

    return (
      <div>
        {/* Context pills */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="dark:bg-card inline-flex shrink-0 items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-sm">
            <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
              {leg.fromIata}
            </span>
            <Plane className="text-muted-foreground/50 h-3.5 w-3.5" />
            <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
              {leg.toIata}
            </span>
          </div>
          {formattedDate && (
            <div className="dark:bg-card inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2 shadow-sm">
              <span className="text-[12px] font-medium">{formattedDate}</span>
            </div>
          )}
        </div>

        {bookingConfirmation}
        {selectedCard}

        {error && (
          <AlertBox
            variant="warning"
            title="Flight search failed"
            description={error}
            className="mb-3"
          />
        )}

        {searchDone && !error && !selectedFlight && (
          <div className="dark:bg-card mb-4 rounded-xl bg-white p-4 text-center shadow-sm">
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
          onClick={() => handleAffiliateClick("empty_state")}
          className="group dark:bg-card block rounded-xl bg-white p-5 text-center shadow-sm transition-all hover:shadow-md"
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
    <div>
      {/* Context pills row */}
      <div className="scrollbar-hide mb-4 flex items-center gap-2 overflow-x-auto py-1">
        <div className="dark:bg-card inline-flex shrink-0 items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-sm">
          <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            {leg.fromIata}
          </span>
          <Plane className="text-muted-foreground/50 h-3.5 w-3.5" />
          <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            {leg.toIata}
          </span>
        </div>
        {formattedDate && (
          <div className="dark:bg-card inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm">
            <span className="text-primary h-3.5 w-3.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h18" />
              </svg>
            </span>
            <span className="text-[12px] font-medium">{formattedDate}</span>
          </div>
        )}
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

      {bookingConfirmation}
      {selectedCard}

      {/* Collapsed state — only show results if user clicks "Change" */}
      {selectedFlight && !showResults ? null : (
        <>
          {/* Results summary + sort tabs */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">
              {sorted.length} result{sorted.length !== 1 ? "s" : ""} found
            </p>
            <div className="flex gap-2">
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
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="dark:bg-card animate-pulse rounded-xl bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-secondary h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="bg-secondary h-5 w-32 rounded" />
                      <div className="bg-secondary h-3 w-24 rounded" />
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="bg-secondary ml-auto h-6 w-16 rounded" />
                      <div className="bg-secondary ml-auto h-3 w-12 rounded" />
                    </div>
                  </div>
                  <div className="border-secondary mt-4 flex items-center justify-between border-t pt-3">
                    <div className="flex gap-4">
                      <div className="bg-secondary h-4 w-16 rounded" />
                      <div className="bg-secondary h-4 w-12 rounded" />
                    </div>
                    <div className="bg-secondary h-8 w-20 rounded-full" />
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
            <div className="flex flex-col gap-3">
              {visible.map((result, i) => {
                const isThisSelected =
                  selectedFlight &&
                  selectedFlight.airline === result.airline &&
                  selectedFlight.price === result.price &&
                  selectedFlight.departureTime === result.departureTime;
                return (
                  <FlightRow
                    key={i}
                    result={result}
                    fromIata={leg.fromIata}
                    toIata={leg.toIata}
                    departureDate={leg.departureDate}
                    tripId={tripId}
                    isSelected={!!isThisSelected}
                    onSelect={onSelectFlight}
                    onRemove={onRemoveSelection}
                  />
                );
              })}
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
                metadata: { ...flightMeta, placement: "footer" },
              })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleAffiliateClick("footer")}
              className="dark:bg-card mt-4 flex items-center justify-center gap-2 rounded-xl bg-white p-3 shadow-sm transition-all hover:shadow-md"
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
                    Show {sorted.length - 5} more flights{" "}
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
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
        </>
      )}
    </div>
  );
}
