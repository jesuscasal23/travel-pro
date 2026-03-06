"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Search, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { buildTrackedLink } from "@/lib/affiliate/link-generator";
import type { FlightSearchResult, FlightLegResults } from "@/lib/flights/types";

type SortMode = "price" | "duration";

interface FlightOptionsPanelProps {
  leg: FlightLegResults;
  tripId: string;
  travelers: number;
  itineraryId?: string;
}

/** Parse "12h 30m" → total minutes for duration sorting */
function durationToMinutes(d: string): number {
  const h = d.match(/(\d+)h/)?.[1];
  const m = d.match(/(\d+)m/)?.[1];
  return parseInt(h ?? "0") * 60 + parseInt(m ?? "0");
}

/** Format ISO time → "08:30" */
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

export function FlightOptionsPanel({
  leg,
  tripId,
  travelers,
  itineraryId,
}: FlightOptionsPanelProps) {
  const [sortMode, setSortMode] = useState<SortMode>("price");
  const [expanded, setExpanded] = useState(false);
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

  const sorted = useMemo(() => {
    const copy = [...displayResults];
    if (sortMode === "duration") {
      copy.sort((a, b) => durationToMinutes(a.duration) - durationToMinutes(b.duration));
    } else {
      copy.sort((a, b) => a.price - b.price);
    }
    return copy;
  }, [displayResults, sortMode]);

  const visible = expanded ? sorted : sorted.slice(0, 3);
  const hasMore = sorted.length > 3;

  const handleLiveSearch = () => {
    void search(leg.fromIata, leg.toIata, leg.departureDate, travelers);
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
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-muted-foreground ml-2 text-sm">Searching flights…</span>
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
        {hasMore && !loading && (
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
                Show {sorted.length - 3} more <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
        {!hasMore && <span />}
        <Button variant="ghost" size="sm" onClick={handleLiveSearch} loading={loading}>
          <Search className="mr-1.5 h-3.5 w-3.5" />
          Search live options
        </Button>
      </div>
    </div>
  );
}
