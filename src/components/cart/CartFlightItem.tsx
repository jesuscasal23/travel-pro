"use client";

import { ArrowRight, Check, Clock, ExternalLink, Plane, Trash2 } from "lucide-react";
import { getAirlineName } from "@/lib/flights/airlines";
import type { FlightSelection } from "@/types";

/** Format ISO time -> "08:30" */
function formatTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

interface CartFlightItemProps {
  selection: FlightSelection;
  awaitingConfirmation?: boolean;
  onBookNow: () => void;
  onMarkBooked: () => void;
  onRemove: () => void;
  onConfirmBooking?: (confirmed: boolean) => void;
}

export function CartFlightItem({
  selection,
  awaitingConfirmation,
  onBookNow,
  onMarkBooked,
  onRemove,
  onConfirmBooking,
}: CartFlightItemProps) {
  const depTime = formatTime(selection.departureTime ?? "");
  const arrTime = formatTime(selection.arrivalTime ?? "");
  const isManual = selection.selectionType === "manual";
  const stopsLabel =
    selection.stops === 0 ? "Non-stop" : `${selection.stops} stop${selection.stops > 1 ? "s" : ""}`;

  return (
    <div className="dark:bg-card rounded-xl bg-white p-4 shadow-sm">
      {/* Booking confirmation prompt */}
      {awaitingConfirmation && onConfirmBooking && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
          <Plane className="text-primary h-4 w-4 shrink-0" />
          <p className="text-foreground flex-1 text-xs font-medium">Did you book this flight?</p>
          <button
            onClick={() => onConfirmBooking(true)}
            className="bg-app-green/10 text-app-green hover:bg-app-green/20 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onConfirmBooking(false)}
            className="bg-app-red/10 text-app-red hover:bg-app-red/20 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Flight info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="bg-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            {isManual ? (
              <Plane className="text-muted-foreground h-4 w-4" />
            ) : (
              <span className="text-foreground text-[10px] font-bold">{selection.airline}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-foreground text-sm font-bold">{selection.fromIata}</span>
              <ArrowRight className="text-muted-foreground/50 h-3 w-3" />
              <span className="text-foreground text-sm font-bold">{selection.toIata}</span>
            </div>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-[11px]">
              {!isManual && depTime && arrTime && (
                <span>
                  {depTime} — {arrTime}
                </span>
              )}
              {!isManual && selection.duration && (
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" /> {selection.duration}
                </span>
              )}
              {!isManual && <span>{stopsLabel}</span>}
              {isManual && (
                <span className="text-muted-foreground italic">
                  {getAirlineName(selection.airline)} search
                </span>
              )}
            </div>
          </div>
        </div>
        {!isManual && selection.price > 0 && (
          <span className="text-foreground text-sm font-bold">
            &euro;{Math.round(selection.price).toLocaleString()}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="border-secondary mt-3 flex items-center justify-between border-t pt-3">
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-app-red flex items-center gap-1 text-[11px] font-medium transition-colors"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onMarkBooked}
            className="text-muted-foreground hover:text-app-green flex items-center gap-1 text-[11px] font-medium transition-colors"
          >
            <Check className="h-3 w-3" /> Mark booked
          </button>
          {isManual ? (
            <a
              href={selection.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors"
            >
              Search again <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <button
              onClick={onBookNow}
              className="from-primary to-primary/70 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              Book Now <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
