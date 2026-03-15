"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  BedDouble,
  Plane,
  ClipboardList,
  ShieldCheck,
  Info,
  CloudSun,
  Smartphone,
  Shield,
  Copy,
  Map,
  Wallet,
} from "lucide-react";
import { useTrips, useAuthStatus } from "@/hooks/api";
import { getCityImage, getCityPlaceholder } from "@/lib/utils/city-images";
import { V2Screen } from "@/components/v2/ui/V2Screen";
import type { TripSummary } from "@/types";

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}

function daysUntil(dateStr: string): number | null {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

function getNextTrip(trips: TripSummary[]): TripSummary | null {
  const upcoming = trips
    .filter((t) => daysUntil(t.dateStart) !== null)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  return upcoming[0] ?? null;
}

export default function HomePage() {
  const router = useRouter();
  const isAuth = useAuthStatus();
  const { data: trips } = useTrips();
  const tripList = trips ?? [];
  const nextTrip = getNextTrip(tripList);
  const destination = nextTrip?.destination ?? "your destination";
  const daysAway = nextTrip ? daysUntil(nextTrip.dateStart) : null;

  return (
    <V2Screen>
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-8 pb-2">
        <div>
          <h1 className="text-[1.8rem] font-bold tracking-[-0.04em] text-[#101114]">Voya</h1>
          <p className="text-brand-primary text-[13px] font-semibold">
            Your Travel Operating System
          </p>
        </div>
        <button
          onClick={() => router.push("/profile")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2f7]"
        >
          <span className="text-sm font-bold text-[#6d7b91]">{isAuth ? "👤" : "?"}</span>
        </button>
      </div>

      {/* Active Trip Card */}
      {nextTrip && (
        <div className="px-6 pt-4">
          <ActiveTripCard trip={nextTrip} onClick={() => router.push(`/trips/${nextTrip.id}`)} />
        </div>
      )}

      {/* Next Steps */}
      <section className="px-6 pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-[#101114]">Next Steps</h2>
          <span className="text-[11px] font-bold tracking-[0.14em] text-[#8ea0bb] uppercase">
            4 pending
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <NextStepRow
            icon={BedDouble}
            color="#8b5cf6"
            label={`Book accommodation in ${destination}`}
          />
          <NextStepRow icon={Plane} color="#3b82f6" label="Upload flight confirmation" />
          <NextStepRow icon={ClipboardList} color="#f59e0b" label="Finish packing checklist" />
          <NextStepRow icon={ShieldCheck} color="#10b981" label="Check visa requirements" />
        </div>
      </section>

      {/* Trip Preparation */}
      <section className="px-6 pt-8">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[#101114]">Trip Preparation</h2>

        <div className="mt-4 rounded-2xl border border-white/80 bg-white/88 p-5 shadow-[0_12px_24px_rgba(27,43,75,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[2rem] font-bold tracking-[-0.04em] text-[#101114]">72%</span>
            <span className="text-[11px] font-bold tracking-[0.14em] text-[#8ea0bb] uppercase">
              Ready
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#eef2f7]">
            <div className="bg-brand-primary h-full rounded-full" style={{ width: "72%" }} />
          </div>
          <div className="mt-4 space-y-2.5">
            <PrepItem icon="✅" label="Flights booked" done />
            <PrepItem icon="✅" label="Visa confirmed" done />
            <PrepItem icon="⚠️" label="Accommodation missing" />
            <PrepItem icon="⚠️" label="Packing incomplete" />
          </div>
        </div>
      </section>

      {/* Smart Alerts */}
      <section className="px-6 pt-8">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[#101114]">Smart Alerts</h2>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#3b82f6]" />
              <div>
                <p className="text-sm font-semibold text-[#1e3a5f]">Flights cheaper this week</p>
                <p className="mt-1 text-xs text-[#4b6b8a]">
                  Prices for {destination} flights have dropped by 15%. Consider booking now.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#fef3c7] bg-[#fffbeb] p-4">
            <div className="flex items-start gap-3">
              <CloudSun className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" />
              <div>
                <p className="text-sm font-semibold text-[#78350f]">
                  Weather change in {destination}
                </p>
                <p className="mt-1 text-xs text-[#92400e]">
                  Expect rain during your first 3 days. Don&apos;t forget an umbrella.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before You Go */}
      <section className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-[#101114]">Before You Go</h2>
          <span className="text-brand-primary text-sm font-semibold">View All</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <ProductCard icon={Smartphone} title="Japan eSIM" detail="10GB · 30 Days" price="$18" />
          <ProductCard icon={Shield} title="Travel Insurance" detail="Comprehensive" price="$42" />
        </div>
      </section>
    </V2Screen>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function ActiveTripCard({ trip, onClick }: { trip: TripSummary; onClick: () => void }) {
  const router = useRouter();
  const cityName = trip.destination ?? trip.region;
  const countryCode = trip.destinationCountryCode ?? "";
  const [src, setSrc] = useState(() =>
    countryCode ? getCityImage(cityName, countryCode) : getCityPlaceholder(cityName)
  );
  const stops = trip.itineraries?.length ?? 1;
  const tripId = trip.id;

  return (
    <div
      className="relative cursor-pointer overflow-hidden rounded-[24px] shadow-[0_20px_40px_rgba(27,43,75,0.12)]"
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={cityName}
        className="h-52 w-full object-cover"
        onError={() => setSrc(getCityPlaceholder(cityName))}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Badges */}
      <div className="absolute top-3 left-3 flex gap-2">
        <span className="rounded-full bg-[#3b82f6] px-2.5 py-1 text-[10px] font-bold text-white uppercase">
          Active Trip
        </span>
      </div>
      <div className="absolute top-3 right-3 flex gap-2">
        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          <CalendarDays className="h-3 w-3" />
          {formatDateRange(trip.dateStart, trip.dateEnd)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm"
        >
          <Copy className="h-3 w-3" />
          Copy Trip
        </button>
      </div>

      {/* Title */}
      <div className="absolute bottom-14 left-4">
        <p className="text-[10px] font-bold tracking-[0.14em] text-white/70 uppercase">
          Travel Pro
        </p>
        <h2 className="text-xl font-bold text-white">{cityName}</h2>
        <p className="text-xs text-white/80">
          {trip.destinationCountry} · {stops} stop{stops !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Quick action bar */}
      <div className="absolute right-0 bottom-0 left-0 flex items-center justify-around bg-black/30 py-2.5 backdrop-blur-sm">
        {[
          { icon: CalendarDays, label: "Itinerary", href: `/trips/${tripId}/itinerary` },
          { icon: BedDouble, label: "Bookings", href: `/trips/${tripId}/bookings` },
          { icon: Wallet, label: "Budget", href: `/trips/${tripId}/budget` },
          { icon: Map, label: "Map", href: `/trips/${tripId}/map` },
        ].map((action) => (
          <button
            key={action.label}
            onClick={(e) => {
              e.stopPropagation();
              router.push(action.href);
            }}
            className="flex flex-col items-center gap-1"
          >
            <action.icon className="h-4 w-4 text-white" />
            <span className="text-[9px] font-semibold tracking-[0.06em] text-white/80 uppercase">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NextStepRow({
  icon: Icon,
  color,
  label,
}: {
  icon: typeof BedDouble;
  color: string;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white/88 px-4 py-3.5 text-left shadow-[0_12px_24px_rgba(27,43,75,0.04)]"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}14` }}
      >
        <Icon className="h-5 w-5" style={{ color }} strokeWidth={2} />
      </div>
      <span className="flex-1 text-[14px] font-semibold tracking-[-0.01em] text-[#17181c]">
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-[#a3adbc]" />
    </button>
  );
}

function PrepItem({ icon, label, done }: { icon: string; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm">{icon}</span>
      <span className={`text-sm ${done ? "text-[#3b4658]" : "text-[#8ea0bb]"}`}>{label}</span>
    </div>
  );
}

function ProductCard({
  icon: Icon,
  title,
  detail,
  price,
}: {
  icon: typeof Smartphone;
  title: string;
  detail: string;
  price: string;
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/88 p-4 shadow-[0_12px_24px_rgba(27,43,75,0.04)]">
      <Icon className="h-6 w-6 text-[#8ea0bb]" strokeWidth={1.5} />
      <p className="mt-3 text-[14px] font-semibold text-[#17181c]">{title}</p>
      <p className="text-xs text-[#8ea0bb]">{detail}</p>
      <p className="mt-2 text-base font-bold text-[#101114]">{price}</p>
    </div>
  );
}
