"use client";

import { useState } from "react";
import { Plus, Plane, Building2, Car, Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import { DevelopmentTag } from "@/components/v2/ui/DevelopmentTag";
import { V2FilterChips } from "@/components/v2/ui/V2FilterChips";
import { V2IconActionButton } from "@/components/v2/ui/V2IconActionButton";
import { V2PageHeader } from "@/components/v2/ui/V2PageHeader";
import { V2Screen } from "@/components/v2/ui/V2Screen";

type BookingType = "flight" | "stay" | "transport" | "activity";

interface Booking {
  id: string;
  type: BookingType;
  title: string;
  subtitle: string;
  date: string;
  price?: string;
  status: "confirmed" | "pending" | "upcoming";
  fromCode?: string;
  toCode?: string;
  fromCity?: string;
  toCity?: string;
  airline?: string;
  flightNumber?: string;
  time?: string;
}

const mockBookings: Booking[] = [
  {
    id: "b1",
    type: "flight",
    title: "Japan Airlines",
    subtitle: "",
    fromCode: "JFK",
    toCode: "HND",
    fromCity: "New York",
    toCity: "Tokyo",
    airline: "JAPAN AIRLINES",
    flightNumber: "JL 005",
    date: "Apr 05 • 10:30 AM",
    status: "confirmed",
  },
  {
    id: "b2",
    type: "stay",
    title: "Aman Tokyo",
    subtitle: "The Otemachi Tower",
    date: "Apr 05 - Apr 10",
    price: "$4500",
    status: "confirmed",
  },
  {
    id: "b3",
    type: "transport",
    title: "Narita Express",
    subtitle: "NRT → Tokyo Station",
    date: "Apr 05 • 02:00 PM",
    price: "$30",
    status: "pending",
  },
];

const filters = ["All", "Flights", "Stays", "Transport", "Activities"] as const;

const filterTypeMap: Record<string, BookingType | null> = {
  All: null,
  Flights: "flight",
  Stays: "stay",
  Transport: "transport",
  Activities: "activity",
};

function FlightCard({ booking }: { booking: Booking }) {
  return (
    <div className="bg-v2-navy rounded-2xl p-5 text-white">
      {/* Top row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane size={16} />
          <span className="text-xs font-semibold tracking-wider uppercase">{booking.airline}</span>
        </div>
        <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
          {booking.flightNumber}
        </span>
      </div>

      {/* Route row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-left">
          <p className="text-3xl font-bold">{booking.fromCode}</p>
          <p className="text-xs text-white/60">{booking.fromCity}</p>
        </div>
        <div className="mx-4 flex flex-1 items-center gap-2">
          <div className="flex-1 border-b border-dashed border-white/30" />
          <Plane size={14} className="shrink-0 rotate-90 text-white/60" />
          <div className="flex-1 border-b border-dashed border-white/30" />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{booking.toCode}</p>
          <p className="text-xs text-white/60">{booking.toCity}</p>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-0.5 text-[10px] tracking-wider text-white/50 uppercase">DATE</p>
          <p className="text-sm font-semibold">{booking.date}</p>
        </div>
        <span className="bg-v2-green/20 text-v2-green rounded-full px-3 py-1 text-xs font-semibold">
          Confirmed
        </span>
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const iconConfig: Record<BookingType, { bg: string; icon: React.ReactNode }> = {
    stay: {
      bg: "bg-brand-primary-soft",
      icon: <Building2 size={20} className="text-brand-primary" />,
    },
    transport: {
      bg: "bg-brand-primary-soft",
      icon: <Car size={20} className="text-brand-primary" />,
    },
    activity: {
      bg: "bg-purple-50",
      icon: <Ticket size={20} className="text-v2-purple" />,
    },
    flight: { bg: "", icon: null },
  };

  const statusColor: Record<string, string> = {
    confirmed: "bg-v2-green",
    pending: "bg-amber-400",
    upcoming: "bg-brand-primary",
  };

  const config = iconConfig[booking.type];

  return (
    <div className="border-v2-border flex items-center gap-4 rounded-xl border p-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}
      >
        {config.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-v2-navy text-sm font-semibold">{booking.title}</p>
        {booking.subtitle && <p className="text-v2-text-muted text-xs">{booking.subtitle}</p>}
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-brand-primary text-xs">{booking.date}</span>
          {booking.price && (
            <span className="text-v2-navy text-xs font-semibold">{booking.price}</span>
          )}
        </div>
      </div>
      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColor[booking.status]}`} />
    </div>
  );
}

export default function BookingsPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredBookings = mockBookings.filter((b) => {
    const type = filterTypeMap[activeFilter];
    if (!type) return true;
    return b.type === type;
  });

  return (
    <V2Screen>
      <V2PageHeader
        title="Wallet"
        titleBadge={<DevelopmentTag />}
        description="Preview data only. Booking sync and management are still in development."
        action={
          <V2IconActionButton
            icon={<Plus size={20} className="text-white" />}
            badge={<DevelopmentTag label="Mock" className="text-v2-navy bg-white" />}
          />
        }
      />

      <V2FilterChips options={filters} active={activeFilter} onChange={setActiveFilter} />

      <div className="px-6 pb-2">
        <DevelopmentTag label="Filters are preview-only" />
      </div>

      <div className="mx-6 mb-6 flex items-center gap-2">
        <ChevronLeft size={14} className="text-v2-text-light shrink-0" />
        <div className="h-2 flex-1 rounded-full bg-gray-200">
          <div className="h-2 w-3/4 rounded-full bg-gray-400" />
        </div>
        <ChevronRight size={14} className="text-v2-text-light shrink-0" />
      </div>

      <div className="px-6 pb-2">
        <DevelopmentTag label="Timeline is preview-only" />
      </div>

      <div className="space-y-3 px-6">
        {filteredBookings.map((booking) =>
          booking.type === "flight" ? (
            <FlightCard key={booking.id} booking={booking} />
          ) : (
            <BookingCard key={booking.id} booking={booking} />
          )
        )}
      </div>
    </V2Screen>
  );
}
