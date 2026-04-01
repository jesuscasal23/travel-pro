"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Clock, Hotel, MapPin, Plane, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CartFlightItem } from "./CartFlightItem";
import { CartHotelItem } from "./CartHotelItem";
import type { CartTrip, FlightSelection, HotelSelection } from "@/types";

/** Format YYYY-MM-DD -> "Oct 24" */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatHotelRange(checkIn?: string | null, checkOut?: string | null): string {
  if (!checkIn || !checkOut) return "Dates not set";
  return `${formatDate(checkIn)} - ${formatDate(checkOut)}`;
}

function formatMoney(value: number): string {
  if (!value || Number.isNaN(value)) return "€0";
  return `€${Math.round(value).toLocaleString()}`;
}

function formatTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

interface CartTripGroupProps {
  trip: CartTrip;
  awaitingIds: Set<string>;
  onBookFlight: (selection: FlightSelection) => void;
  onBookHotel: (selection: HotelSelection) => void;
  onMarkBooked: (
    selectionId: string,
    type: "flights" | "hotels",
    tripId: string,
    booked?: boolean
  ) => void;
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

  const outboundFlight = trip.slots.outboundFlight;
  const returnFlight = trip.slots.returnFlight;
  const primaryHotel = trip.slots.primaryHotel;

  const slotFlightIds = new Set([outboundFlight?.id, returnFlight?.id].filter(Boolean) as string[]);
  const slotHotelIds = new Set([primaryHotel?.id].filter(Boolean) as string[]);

  const otherFlights = trip.flights.filter((f) => !slotFlightIds.has(f.id));
  const otherHotels = trip.hotels.filter((h) => !slotHotelIds.has(h.id));
  const hasExtras = otherFlights.length > 0 || otherHotels.length > 0;

  const costSummary = trip.costSummary;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto px-1">
        <span className="bg-surface-soft text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm">
          <MapPin className="text-primary h-3 w-3" />
          {destination}
        </span>
        <span className="bg-surface-soft text-foreground inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium shadow-sm">
          {formatDate(trip.dateStart)} - {formatDate(trip.dateEnd)}
        </span>
        <Badge variant="neutral">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </Badge>
      </div>

      {(costSummary.bookedTotal > 0 || costSummary.pendingTotal > 0) && (
        <div className="bg-brand-primary-soft/60 text-brand-primary-dark rounded-2xl px-4 py-3 text-sm font-semibold dark:bg-slate-800/60 dark:text-white">
          <div className="text-brand-primary-dark/80 flex items-center justify-between text-[11px] tracking-wide uppercase dark:text-white/70">
            <span>Booked</span>
            <span>Pending</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-lg font-bold">
            <span>{formatMoney(costSummary.bookedTotal)}</span>
            <span>{formatMoney(costSummary.pendingTotal)}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <FlightSlotCard
          label="Outbound flight"
          tripId={trip.tripId}
          selection={outboundFlight}
          awaitingConfirmation={outboundFlight ? awaitingIds.has(outboundFlight.id) : false}
          onBookFlight={onBookFlight}
          onMarkBooked={(selectionId, booked) =>
            onMarkBooked(selectionId, "flights", trip.tripId, booked)
          }
          onRemove={(selectionId) => onRemove(selectionId, "flights", trip.tripId)}
          onConfirm={(selectionId, confirmed) =>
            onConfirmBooking(selectionId, confirmed, "flights", trip.tripId)
          }
        />
        <FlightSlotCard
          label="Return flight"
          tripId={trip.tripId}
          selection={returnFlight}
          awaitingConfirmation={returnFlight ? awaitingIds.has(returnFlight.id) : false}
          onBookFlight={onBookFlight}
          onMarkBooked={(selectionId, booked) =>
            onMarkBooked(selectionId, "flights", trip.tripId, booked)
          }
          onRemove={(selectionId) => onRemove(selectionId, "flights", trip.tripId)}
          onConfirm={(selectionId, confirmed) =>
            onConfirmBooking(selectionId, confirmed, "flights", trip.tripId)
          }
        />
        <HotelSlotCard
          label="Primary stay"
          tripId={trip.tripId}
          selection={primaryHotel}
          onBookHotel={onBookHotel}
          onMarkBooked={(selectionId, booked) =>
            onMarkBooked(selectionId, "hotels", trip.tripId, booked)
          }
          onRemove={(selectionId) => onRemove(selectionId, "hotels", trip.tripId)}
        />
      </div>

      {hasExtras && (
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-1.5 px-1 text-[10px] font-bold tracking-widest uppercase">
            More saved options
          </div>
          {otherFlights.length > 0 && (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-1.5 px-1 text-[10px] font-bold tracking-widest uppercase">
                <Plane className="h-3 w-3" /> Flights
              </div>
              {otherFlights.map((f) => (
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

          {otherHotels.length > 0 && (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-1.5 px-1 text-[10px] font-bold tracking-widest uppercase">
                <Hotel className="h-3 w-3" /> Hotels
              </div>
              {otherHotels.map((h) => (
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
      )}
    </div>
  );
}

interface FlightSlotCardProps {
  label: string;
  tripId: string;
  selection: FlightSelection | null;
  awaitingConfirmation: boolean;
  onBookFlight: (selection: FlightSelection) => void;
  onMarkBooked: (selectionId: string, booked?: boolean) => void;
  onRemove: (selectionId: string) => void;
  onConfirm: (selectionId: string, confirmed: boolean) => void;
}

function FlightSlotCard({
  label,
  tripId,
  selection,
  awaitingConfirmation,
  onBookFlight,
  onMarkBooked,
  onRemove,
  onConfirm,
}: FlightSlotCardProps) {
  if (!selection) {
    return (
      <EmptySlotCard
        label={label}
        cta="Add flight details"
        href={`/trips/${tripId}`}
        icon={<Plane className="h-4 w-4" />}
      />
    );
  }

  const isManual = selection.selectionType === "manual";
  const depTime = formatTime(selection.departureTime);
  const arrTime = formatTime(selection.arrivalTime);

  return (
    <div className="border-edge rounded-2xl border bg-white/80 p-4 shadow-sm dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-dim text-[11px] font-semibold tracking-wider uppercase">{label}</p>
          <div className="text-navy mt-1 flex items-center gap-2 text-lg font-bold">
            <span>{selection.fromIata}</span>
            <ArrowRight className="text-muted-foreground h-4 w-4" />
            <span>{selection.toIata}</span>
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
            <span>{formatDate(selection.departureDate)}</span>
            {depTime && arrTime ? (
              <span>
                {depTime} – {arrTime}
              </span>
            ) : null}
            {selection.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {selection.duration}
              </span>
            )}
          </div>
        </div>
        <SlotStatusBadge booked={selection.booked} />
      </div>

      {awaitingConfirmation && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          <Plane className="h-3.5 w-3.5" /> Did you book this?
          <button
            onClick={() => onConfirm(selection.id, true)}
            className="bg-app-green/10 text-app-green rounded-full px-2 py-0.5 text-[11px]"
          >
            Yes
          </button>
          <button
            onClick={() => onConfirm(selection.id, false)}
            className="bg-app-red/10 text-app-red rounded-full px-2 py-0.5 text-[11px]"
          >
            Not yet
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {!selection.booked ? (
            <button
              onClick={() => onMarkBooked(selection.id, true)}
              className="text-app-green border-edge hover:border-app-green/40 hover:text-app-green inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold"
            >
              <Check className="h-3 w-3" /> Mark booked
            </button>
          ) : (
            <button
              onClick={() => onMarkBooked(selection.id, false)}
              className="text-dim hover:text-foreground inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-[11px]"
            >
              <ArrowRight className="h-3 w-3 rotate-180" /> Mark pending
            </button>
          )}
          <button
            onClick={() => onBookFlight(selection)}
            className="bg-primary hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white"
          >
            {isManual ? "Search again" : "Book now"}
          </button>
        </div>
        <button
          onClick={() => onRemove(selection.id)}
          className="text-faint hover:text-dim rounded-full p-2"
          aria-label="Clear slot"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface HotelSlotCardProps {
  label: string;
  tripId: string;
  selection: HotelSelection | null;
  onBookHotel: (selection: HotelSelection) => void;
  onMarkBooked: (selectionId: string, booked?: boolean) => void;
  onRemove: (selectionId: string) => void;
}

function HotelSlotCard({
  label,
  tripId,
  selection,
  onBookHotel,
  onMarkBooked,
  onRemove,
}: HotelSlotCardProps) {
  if (!selection) {
    return (
      <EmptySlotCard
        label={label}
        cta="Add stay"
        href={`/trips/${tripId}`}
        icon={<Hotel className="h-4 w-4" />}
      />
    );
  }

  return (
    <div className="border-edge rounded-2xl border bg-white/80 p-4 shadow-sm dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-dim text-[11px] font-semibold tracking-wider uppercase">{label}</p>
          <p className="text-navy mt-1 text-lg font-bold">{selection.hotelName}</p>
          <p className="text-muted-foreground text-sm">{selection.city}</p>
          <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
            <CalendarDays className="h-3 w-3" />{" "}
            {formatHotelRange(selection.checkIn, selection.checkOut)}
          </div>
        </div>
        <SlotStatusBadge booked={selection.booked} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {!selection.booked ? (
            <button
              onClick={() => onMarkBooked(selection.id, true)}
              className="text-app-green border-edge hover:border-app-green/40 hover:text-app-green inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold"
            >
              <Check className="h-3 w-3" /> Mark booked
            </button>
          ) : (
            <button
              onClick={() => onMarkBooked(selection.id, false)}
              className="text-dim hover:text-foreground inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-[11px]"
            >
              <ArrowRight className="h-3 w-3 rotate-180" /> Mark pending
            </button>
          )}
          <button
            onClick={() => onBookHotel(selection)}
            className="bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold"
          >
            Reserve
          </button>
        </div>
        <button
          onClick={() => onRemove(selection.id)}
          className="text-faint hover:text-dim rounded-full p-2"
          aria-label="Clear slot"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface EmptySlotCardProps {
  label: string;
  cta: string;
  href: string;
  icon: ReactNode;
}

function EmptySlotCard({ label, cta, href, icon }: EmptySlotCardProps) {
  return (
    <Link
      href={href}
      className="border-edge/60 hover:border-primary/40 flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-left text-sm shadow-sm transition"
    >
      <div className="bg-surface-soft text-primary flex h-10 w-10 items-center justify-center rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-dim text-[11px] font-semibold tracking-wider uppercase">{label}</p>
        <p className="text-navy text-sm font-semibold">{cta}</p>
      </div>
    </Link>
  );
}

interface SlotStatusBadgeProps {
  booked: boolean;
}

function SlotStatusBadge({ booked }: SlotStatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
        booked ? "bg-app-green/15 text-app-green" : "bg-amber-100 text-amber-800"
      }`}
    >
      {booked ? "Booked" : "Needs booking"}
    </span>
  );
}
