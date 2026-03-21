"use client";

import { memo } from "react";
import { getAirlineName } from "@/lib/flights/airlines";
import type { FlightSearchResult } from "@/lib/flights/types";

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
  if (stops === 0) return <span className="text-green-600 dark:text-green-400">Direct</span>;
  return (
    <span className="text-amber-600 dark:text-amber-400">
      {stops} stop{stops > 1 ? "s" : ""}
    </span>
  );
}

function buildBookUrl(
  token: string,
  fromIata: string,
  toIata: string,
  departureDate: string,
  tripId?: string
): string {
  const params = new URLSearchParams({
    token,
    dep: fromIata,
    arr: toIata,
    date: departureDate,
  });
  if (tripId) params.set("tripId", tripId);
  return `/api/v1/flights/book?${params}`;
}

export const FlightRow = memo(function FlightRow({
  result,
  fromIata,
  toIata,
  departureDate,
  tripId,
}: {
  result: FlightSearchResult;
  fromIata: string;
  toIata: string;
  departureDate: string;
  tripId?: string;
  /** @deprecated No longer used — kept for backwards compat */
  bookingHref?: string;
}) {
  const canBook = !!result.bookingToken;
  const airlineName = getAirlineName(result.airline);
  const depTime = formatTime(result.departureTime);
  const arrTime = formatTime(result.arrivalTime);

  return (
    <div className="border-border rounded-lg border p-3 transition-colors">
      {/* Row 1: times + airline + price */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Times row */}
          {(depTime || arrTime) && (
            <div className="text-foreground mb-0.5 flex items-baseline gap-1.5 text-sm font-semibold tabular-nums">
              {depTime && <span>{depTime}</span>}
              {depTime && arrTime && (
                <span className="text-muted-foreground text-xs font-normal">&rarr;</span>
              )}
              {arrTime && <span>{arrTime}</span>}
            </div>
          )}
          {/* Airline + stops + duration */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            <span className="text-foreground font-medium">{airlineName}</span>
            <span>&middot;</span>
            <StopsLabel stops={result.stops} />
            <span>&middot;</span>
            <span>{result.duration}</span>
          </div>
        </div>
        <div className="text-foreground shrink-0 text-sm font-bold" data-testid="flight-price">
          &euro;{Math.round(result.price).toLocaleString()}
        </div>
      </div>

      {canBook && (
        <a
          href={buildBookUrl(result.bookingToken!, fromIata, toIata, departureDate, tripId)}
          target="_blank"
          rel="noreferrer"
          className="bg-primary hover:bg-primary/90 mt-2 flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold text-white transition-colors"
        >
          Book now &rarr;
        </a>
      )}
    </div>
  );
});
