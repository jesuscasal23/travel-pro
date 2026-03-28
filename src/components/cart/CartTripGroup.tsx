"use client";

import { MapPin, Plane, Hotel } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CartFlightItem } from "./CartFlightItem";
import { CartHotelItem } from "./CartHotelItem";
import type { CartTrip, FlightSelection, HotelSelection } from "@/types";

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

interface CartTripGroupProps {
  trip: CartTrip;
  awaitingIds: Set<string>;
  onBookFlight: (selection: FlightSelection) => void;
  onBookHotel: (selection: HotelSelection) => void;
  onMarkBooked: (selectionId: string, type: "flights" | "hotels", tripId: string) => void;
  onRemove: (selectionId: string, type: "flights" | "hotels", tripId: string) => void;
  onConfirmBooking: (
    selectionId: string,
    confirmed: boolean,
    type: "flights" | "hotels",
    tripId: string
  ) => void;
}

export function CartTripGroup({
  trip,
  awaitingIds,
  onBookFlight,
  onBookHotel,
  onMarkBooked,
  onRemove,
  onConfirmBooking,
}: CartTripGroupProps) {
  const totalItems = trip.flights.length + trip.hotels.length;
  const destination = trip.destination || trip.region || "Trip";

  return (
    <div className="space-y-3">
      {/* Trip header */}
      <div className="flex items-center gap-2 overflow-x-auto px-1">
        <span className="bg-surface-soft text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm">
          <MapPin className="text-primary h-3 w-3" />
          {destination}
        </span>
        <span className="bg-surface-soft text-foreground inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium shadow-sm">
          {formatDate(trip.dateStart)} — {formatDate(trip.dateEnd)}
        </span>
        <Badge variant="neutral">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Flight selections */}
      {trip.flights.length > 0 && (
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-1.5 px-1 text-[10px] font-bold tracking-widest uppercase">
            <Plane className="h-3 w-3" /> Flights
          </div>
          {trip.flights.map((f) => (
            <CartFlightItem
              key={f.id}
              selection={f}
              awaitingConfirmation={awaitingIds.has(f.id)}
              onBookNow={() => onBookFlight(f)}
              onMarkBooked={() => onMarkBooked(f.id, "flights", trip.tripId)}
              onRemove={() => onRemove(f.id, "flights", trip.tripId)}
              onConfirmBooking={(confirmed) =>
                onConfirmBooking(f.id, confirmed, "flights", trip.tripId)
              }
            />
          ))}
        </div>
      )}

      {/* Hotel selections */}
      {trip.hotels.length > 0 && (
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-1.5 px-1 text-[10px] font-bold tracking-widest uppercase">
            <Hotel className="h-3 w-3" /> Hotels
          </div>
          {trip.hotels.map((h) => (
            <CartHotelItem
              key={h.id}
              selection={h}
              awaitingConfirmation={awaitingIds.has(h.id)}
              onBookNow={() => onBookHotel(h)}
              onMarkBooked={() => onMarkBooked(h.id, "hotels", trip.tripId)}
              onRemove={() => onRemove(h.id, "hotels", trip.tripId)}
              onConfirmBooking={(confirmed) =>
                onConfirmBooking(h.id, confirmed, "hotels", trip.tripId)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
