"use client";

import { useState } from "react";
import Link from "next/link";
import { Plane, Building2, CheckCircle2, ExternalLink, ShoppingBag } from "lucide-react";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppScreen } from "@/components/ui/AppScreen";
import { useCart } from "@/hooks/api/selections/useCart";
import { useMarkSelectionBooked } from "@/hooks/api/selections/useMarkSelectionBooked";
import { useRemoveSelection } from "@/hooks/api/selections/useRemoveSelection";
import type { CartTrip, FlightSelection, HotelSelection } from "@/types";

const filters = ["All", "Flights", "Stays"] as const;
type Filter = (typeof filters)[number];

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function directionLabel(direction: string) {
  if (direction === "outbound") return "Outbound";
  if (direction === "return") return "Return";
  return "Connecting";
}

interface FlightCardProps {
  flight: FlightSelection;
  onMarkBooked: (booked: boolean) => void;
  onRemove: () => void;
}

function FlightCard({ flight, onMarkBooked, onRemove }: FlightCardProps) {
  return (
    <div className="bg-navy rounded-2xl p-5 text-white">
      {/* Top row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane size={16} />
          <span className="text-xs font-semibold tracking-wider uppercase">{flight.airline}</span>
        </div>
        <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
          {directionLabel(flight.direction)}
        </span>
      </div>

      {/* Route row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-left">
          <p className="text-3xl font-bold">{flight.fromIata}</p>
          {flight.departureTime && <p className="text-xs text-white/60">{flight.departureTime}</p>}
        </div>
        <div className="mx-4 flex flex-1 items-center gap-2">
          <div className="flex-1 border-b border-dashed border-white/30" />
          <Plane size={14} className="shrink-0 rotate-90 text-white/60" />
          <div className="flex-1 border-b border-dashed border-white/30" />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{flight.toIata}</p>
          {flight.arrivalTime && <p className="text-xs text-white/60">{flight.arrivalTime}</p>}
        </div>
      </div>

      {/* Date + price row */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="mb-0.5 text-[10px] tracking-wider text-white/50 uppercase">DATE</p>
          <p className="text-sm font-semibold">{formatDate(flight.departureDate)}</p>
        </div>
        <div className="text-right">
          <p className="mb-0.5 text-[10px] tracking-wider text-white/50 uppercase">PRICE</p>
          <p className="text-sm font-semibold">€{flight.price.toLocaleString()}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        {flight.booked ? (
          <button
            onClick={() => onMarkBooked(false)}
            className="bg-app-green/20 text-app-green flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          >
            <CheckCircle2 size={13} />
            Booked
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <a
              href={flight.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
            >
              <ExternalLink size={12} />
              Book
            </a>
            <button
              onClick={() => onMarkBooked(true)}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80"
            >
              Mark as booked
            </button>
          </div>
        )}
        <button onClick={onRemove} className="text-[11px] text-white/30 hover:text-white/60">
          Remove
        </button>
      </div>
    </div>
  );
}

interface HotelCardProps {
  hotel: HotelSelection;
  onMarkBooked: (booked: boolean) => void;
  onRemove: () => void;
}

function HotelCard({ hotel, onMarkBooked, onRemove }: HotelCardProps) {
  return (
    <div className="border-edge rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <div className="bg-brand-primary-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <Building2 size={20} className="text-brand-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-navy text-sm font-semibold">{hotel.hotelName}</p>
          <p className="text-dim text-xs">{hotel.city}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-brand-primary text-xs">
              {formatDate(hotel.checkIn)} – {formatDate(hotel.checkOut)}
            </span>
            {hotel.totalPrice != null && (
              <span className="text-navy text-xs font-semibold">
                {hotel.currency} {hotel.totalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-edge mt-3 flex items-center justify-between border-t pt-3">
        {hotel.booked ? (
          <button
            onClick={() => onMarkBooked(false)}
            className="bg-app-green/10 text-app-green flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          >
            <CheckCircle2 size={13} />
            Booked
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <a
              href={hotel.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <ExternalLink size={12} />
              Book
            </a>
            <button
              onClick={() => onMarkBooked(true)}
              className="border-edge text-dim rounded-full border px-3 py-1.5 text-xs font-semibold"
            >
              Mark as booked
            </button>
          </div>
        )}
        <button onClick={onRemove} className="text-faint hover:text-dim text-[11px]">
          Remove
        </button>
      </div>
    </div>
  );
}

interface TripGroupProps {
  trip: CartTrip;
  filter: Filter;
  onMarkBooked: (params: {
    tripId: string;
    selectionId: string;
    type: "flights" | "hotels";
    booked: boolean;
  }) => void;
  onRemove: (params: { tripId: string; selectionId: string; type: "flights" | "hotels" }) => void;
}

function TripGroup({ trip, filter, onMarkBooked, onRemove }: TripGroupProps) {
  const flights: FlightSelection[] = filter !== "Stays" ? trip.flights : [];
  const hotels: HotelSelection[] = filter !== "Flights" ? trip.hotels : [];

  if (flights.length === 0 && hotels.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-navy text-sm font-semibold">{trip.destination ?? trip.region}</h3>
        <span className="text-dim text-xs">
          {formatDate(trip.dateStart)} – {formatDate(trip.dateEnd)}
        </span>
      </div>

      {flights.map((flight) => (
        <FlightCard
          key={flight.id}
          flight={flight}
          onMarkBooked={(booked) =>
            onMarkBooked({ tripId: trip.tripId, selectionId: flight.id, type: "flights", booked })
          }
          onRemove={() =>
            onRemove({ tripId: trip.tripId, selectionId: flight.id, type: "flights" })
          }
        />
      ))}

      {hotels.map((hotel) => (
        <HotelCard
          key={hotel.id}
          hotel={hotel}
          onMarkBooked={(booked) =>
            onMarkBooked({ tripId: trip.tripId, selectionId: hotel.id, type: "hotels", booked })
          }
          onRemove={() => onRemove({ tripId: trip.tripId, selectionId: hotel.id, type: "hotels" })}
        />
      ))}
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="space-y-6 px-6">
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
        <div className="bg-navy h-44 animate-pulse rounded-2xl opacity-20" />
        <div className="border-edge h-24 animate-pulse rounded-xl border" />
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const { data: trips, isLoading } = useCart();
  const markBooked = useMarkSelectionBooked();
  const removeSelection = useRemoveSelection();

  const hasItems = trips?.some((t) => {
    if (activeFilter === "Flights") return t.flights.length > 0;
    if (activeFilter === "Stays") return t.hotels.length > 0;
    return t.flights.length > 0 || t.hotels.length > 0;
  });

  return (
    <AppScreen>
      <PageHeader
        title="Cart"
        description="Your selected flights and hotels across upcoming trips."
      />

      <FilterChips
        options={filters}
        active={activeFilter}
        onChange={(f) => setActiveFilter(f as Filter)}
      />

      {isLoading ? (
        <CartSkeleton />
      ) : !hasItems ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
            <ShoppingBag size={28} className="text-faint" />
          </div>
          <p className="text-navy mb-1 text-base font-semibold">Your cart is empty</p>
          <p className="text-dim mb-6 text-sm">
            Select flights or hotels from a trip to track them here.
          </p>
          <Link href="/trips" className="btn-primary px-5 py-2 text-sm">
            View trips
          </Link>
        </div>
      ) : (
        <div className="space-y-8 px-6 pb-8">
          {trips!.map((trip) => (
            <TripGroup
              key={trip.tripId}
              trip={trip}
              filter={activeFilter}
              onMarkBooked={({ tripId, selectionId, type, booked }) =>
                markBooked.mutate({ tripId, selectionId, type, booked })
              }
              onRemove={({ tripId, selectionId, type }) =>
                removeSelection.mutate({ tripId, selectionId, type })
              }
            />
          ))}
        </div>
      )}
    </AppScreen>
  );
}
