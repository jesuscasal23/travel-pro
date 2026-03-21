"use client";

import { memo } from "react";
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
  if (stops === 0) return <span className="text-green-600 dark:text-green-400">Nonstop</span>;
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
  departureDate: string
): string {
  const params = new URLSearchParams({
    token,
    dep: fromIata,
    arr: toIata,
    date: departureDate,
  });
  return `/api/v1/flights/book?${params}`;
}

export const FlightRow = memo(function FlightRow({
  result,
  fromIata,
  toIata,
  departureDate,
}: {
  result: FlightSearchResult;
  fromIata: string;
  toIata: string;
  departureDate: string;
  /** @deprecated No longer used — kept for backwards compat */
  bookingHref?: string;
}) {
  const canBook = !!result.bookingToken;

  return (
    <div className="border-border rounded-lg border p-3 transition-colors">
      <div className="flex items-center justify-between">
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
        <div className="text-foreground text-sm font-bold">
          €{Math.round(result.price).toLocaleString()}
        </div>
      </div>

      {canBook && (
        <a
          href={buildBookUrl(result.bookingToken!, fromIata, toIata, departureDate)}
          target="_blank"
          rel="noreferrer"
          className="bg-primary hover:bg-primary/90 mt-2 flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold text-white transition-colors"
        >
          Book now →
        </a>
      )}
    </div>
  );
});
