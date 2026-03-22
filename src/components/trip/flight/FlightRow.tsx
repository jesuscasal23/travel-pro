"use client";

import { memo } from "react";
import { ArrowRight, Clock } from "lucide-react";
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

  const stopsLabel =
    result.stops === 0 ? "Non-stop" : `${result.stops} Stop${result.stops > 1 ? "s" : ""}`;

  return (
    <div className="group hover:ring-primary/10 dark:bg-card rounded-xl bg-white p-4 shadow-sm transition-all hover:ring-1">
      {/* Top section: airline badge + times + price */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-4">
          {/* Airline IATA badge */}
          <div className="bg-secondary flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg p-2">
            <span className="text-foreground text-xs font-bold">{result.airline}</span>
          </div>
          {/* Times + route info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              {depTime || arrTime ? (
                <>
                  {depTime && (
                    <span className="font-display text-foreground text-lg font-bold">
                      {depTime}
                    </span>
                  )}
                  {depTime && arrTime && (
                    <ArrowRight className="text-muted-foreground/50 h-3.5 w-3.5" />
                  )}
                  {arrTime && (
                    <span className="font-display text-foreground text-lg font-bold">
                      {arrTime}
                    </span>
                  )}
                </>
              ) : (
                <span className="font-display text-foreground text-lg font-bold">
                  {airlineName}
                </span>
              )}
            </div>
            <span className="text-muted-foreground text-[11px] font-medium">
              {fromIata} - {toIata} &middot; {stopsLabel}
            </span>
          </div>
        </div>
        {/* Price */}
        <div className="shrink-0 text-right">
          <p className="font-display text-foreground text-xl font-bold" data-testid="flight-price">
            &euro;{Math.round(result.price).toLocaleString()}
          </p>
          <span className="text-muted-foreground text-[10px] font-bold tracking-tighter uppercase">
            Per person
          </span>
        </div>
      </div>

      {/* Divider + bottom section */}
      <div className="border-secondary mt-4 flex items-center justify-between border-t pt-3">
        <div className="flex gap-4">
          <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <Clock className="h-3.5 w-3.5" /> {result.duration}
          </span>
          {result.stops === 0 && (
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              Direct
            </span>
          )}
        </div>
        {canBook ? (
          <a
            href={buildBookUrl(result.bookingToken!, fromIata, toIata, departureDate, tripId)}
            target="_blank"
            rel="noreferrer"
            className="from-primary to-primary/70 hover:shadow-primary/20 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:shadow-lg active:scale-95"
          >
            Book Now
          </a>
        ) : (
          <span className="text-muted-foreground text-[10px] font-medium">No booking link</span>
        )}
      </div>
    </div>
  );
});
