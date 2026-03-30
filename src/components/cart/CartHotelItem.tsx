"use client";

import { Check, ExternalLink, Hotel, Star, Trash2 } from "lucide-react";
import type { HotelSelection } from "@/types";

/** Format YYYY-MM-DD → "Oct 24" */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

interface CartHotelItemProps {
  selection: HotelSelection;
  awaitingConfirmation?: boolean;
  onBookNow: () => void;
  onMarkBooked: () => void;
  onRemove: () => void;
  onConfirmBooking?: (confirmed: boolean) => void;
}

export function CartHotelItem({
  selection,
  awaitingConfirmation,
  onBookNow,
  onMarkBooked,
  onRemove,
  onConfirmBooking,
}: CartHotelItemProps) {
  const isManual = selection.selectionType === "manual";

  return (
    <div className="dark:bg-card rounded-xl bg-white p-4 shadow-sm">
      {/* Booking confirmation prompt */}
      {awaitingConfirmation && onConfirmBooking && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
          <Hotel className="text-primary h-4 w-4 shrink-0" />
          <p className="text-foreground flex-1 text-xs font-medium">
            Did you book {selection.hotelName}?
          </p>
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

      {/* Hotel info */}
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
          <div className="from-primary/10 to-primary/5 flex h-full w-full items-center justify-center bg-gradient-to-br">
            <Hotel className="text-primary/30 h-6 w-6" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-foreground truncate text-sm font-bold">{selection.hotelName}</h4>
            {selection.rating != null && (
              <div
                className="flex shrink-0 items-center gap-0.5"
                title={`${selection.rating}-star hotel classification`}
              >
                {Array.from({ length: selection.rating }, (_, i) => (
                  <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            )}
          </div>
          <div className="text-muted-foreground mt-0.5 text-[11px]">
            {selection.city} &middot; {formatDate(selection.checkIn)} —{" "}
            {formatDate(selection.checkOut)}
          </div>
          {!isManual && selection.pricePerNight != null && (
            <div className="mt-1">
              <span className="text-foreground text-sm font-bold">
                &euro;{selection.pricePerNight}
              </span>
              <span className="text-muted-foreground text-[10px]">/night</span>
              {selection.totalPrice != null && (
                <span className="text-muted-foreground ml-2 text-[10px]">
                  (&euro;{Math.round(selection.totalPrice)} total)
                </span>
              )}
            </div>
          )}
        </div>
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
