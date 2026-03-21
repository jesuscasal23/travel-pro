"use client";

import { memo, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client/api-fetch";
import { useToastStore } from "@/stores/useToastStore";
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
  fromIata,
  toIata,
  departureDate,
  bookingHref,
}: {
  result: FlightSearchResult;
  fromIata: string;
  toIata: string;
  departureDate: string;
  bookingHref: string;
}) {
  const [resolving, setResolving] = useState(false);
  const toast = useToastStore((s) => s.toast);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();

      // No booking token — show error, don't silently redirect to Skyscanner
      if (!result.bookingToken) {
        toast({
          title: "Booking link unavailable",
          description:
            "Google Flights didn't provide a booking link for this flight. Try another option or search manually.",
          variant: "error",
        });
        return;
      }

      if (resolving) return;

      setResolving(true);
      try {
        const { bookingUrl } = await apiFetch<{ bookingUrl: string | null }>(
          "/api/v1/flights/booking-url",
          {
            source: "FlightRow",
            method: "POST",
            body: {
              bookingToken: result.bookingToken,
              departureId: fromIata,
              arrivalId: toIata,
              outboundDate: departureDate,
            },
            fallbackMessage: "Could not resolve booking link",
          }
        );

        if (bookingUrl) {
          window.open(bookingUrl, "_blank", "noopener,noreferrer");
        } else {
          toast({
            title: "Could not resolve booking link",
            description:
              "The airline booking page couldn't be reached. Try again or pick a different flight.",
            variant: "error",
          });
        }
      } catch {
        toast({
          title: "Booking link failed",
          description: "Something went wrong resolving the booking link. Please try again.",
          variant: "error",
        });
      } finally {
        setResolving(false);
      }
    },
    [result.bookingToken, resolving, toast]
  );

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
        <button
          type="button"
          onClick={handleClick}
          disabled={resolving}
          className="bg-primary hover:bg-primary/90 mt-2 flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold text-white transition-colors disabled:opacity-70"
        >
          {resolving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding best booking link…
            </>
          ) : (
            "Book now →"
          )}
        </button>
      )}
    </div>
  );
});
