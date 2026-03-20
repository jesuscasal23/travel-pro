"use client";

import { memo, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client/api-fetch";
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

export const FlightRow = memo(function FlightRow({
  result,
  bookingHref,
}: {
  result: FlightSearchResult;
  bookingHref: string;
}) {
  const [resolving, setResolving] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      // No booking token — use the fallback Skyscanner link directly
      if (!result.bookingToken) return;

      e.preventDefault();
      if (resolving) return;

      setResolving(true);
      try {
        const { bookingUrl } = await apiFetch<{ bookingUrl: string | null }>(
          "/api/v1/flights/booking-url",
          {
            source: "FlightRow",
            method: "POST",
            body: { bookingToken: result.bookingToken },
            fallbackMessage: "Could not resolve booking link",
          }
        );

        if (bookingUrl) {
          window.open(bookingUrl, "_blank", "noopener,noreferrer");
        } else {
          // Fallback to Skyscanner if resolution failed
          window.open(bookingHref, "_blank", "noopener,noreferrer");
        }
      } catch {
        // On error, fall back to Skyscanner link
        window.open(bookingHref, "_blank", "noopener,noreferrer");
      } finally {
        setResolving(false);
      }
    },
    [result.bookingToken, bookingHref, resolving]
  );

  return (
    <a
      href={bookingHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`border-border hover:border-primary hover:bg-primary/5 flex items-center justify-between rounded-lg border p-3 transition-colors ${
        resolving ? "pointer-events-none opacity-70" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {resolving ? (
          <Loader2 className="text-primary h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <span className="shrink-0 text-base">✈️</span>
        )}
        <div className="min-w-0">
          <div className="text-foreground flex items-center gap-2 text-sm font-medium">
            <span>{result.airline}</span>
            <span className="text-muted-foreground">·</span>
            <StopsLabel stops={result.stops} />
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{result.duration}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {resolving ? (
              "Finding best booking link…"
            ) : (
              <>
                {formatTime(result.departureTime)}
                {result.arrivalTime && ` → ${formatTime(result.arrivalTime)}`}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-foreground text-sm font-bold">
        €{Math.round(result.price).toLocaleString()}
      </div>
    </a>
  );
});
