"use client";

import { useRouter } from "next/navigation";
import {
  ChevronRight,
  BedDouble,
  Plane,
  ClipboardList,
  ShieldCheck,
  Info,
  CloudSun,
  Smartphone,
  Shield,
} from "lucide-react";
import { useTrips } from "@/hooks/api";
import { AppScreen } from "@/components/ui/AppScreen";
import { ActiveTripCard } from "@/components/v2/ActiveTripCard";
import { daysUntil } from "@/lib/utils/format/date";
import type { TripSummary } from "@/types";

function getNextTrip(trips: TripSummary[]): TripSummary | null {
  const upcoming = trips
    .filter((t) => daysUntil(t.dateStart) !== null)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  return upcoming[0] ?? null;
}

export default function HomePage() {
  const router = useRouter();
  const { data: trips } = useTrips();
  const tripList = trips ?? [];
  const nextTrip = getNextTrip(tripList);
  const destination = nextTrip?.destination ?? "your destination";
  const daysAway = nextTrip ? daysUntil(nextTrip.dateStart) : null;

  return (
    <AppScreen>
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-8 pb-2">
        <div>
          <h1 className="text-v2-dark text-[1.8rem] font-bold tracking-[-0.04em]">Voya</h1>
          <p className="text-brand-primary text-[13px] font-semibold">
            Your Travel Operating System
          </p>
        </div>
        <button
          onClick={() => router.push("/profile")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2f7]"
        >
          <span className="text-v2-text-muted text-sm font-bold">👤</span>
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
          <h2 className="text-v2-dark text-lg font-bold tracking-[-0.02em]">Next Steps</h2>
          <span className="text-v2-label text-[11px] font-bold tracking-[0.14em] uppercase">
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
        <h2 className="text-v2-dark text-lg font-bold tracking-[-0.02em]">Trip Preparation</h2>

        <div className="shadow-glass-sm mt-4 rounded-2xl border border-white/80 bg-white/88 p-5">
          <div className="flex items-center justify-between">
            <span className="text-v2-dark text-[2rem] font-bold tracking-[-0.04em]">72%</span>
            <span className="text-v2-label text-[11px] font-bold tracking-[0.14em] uppercase">
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
        <h2 className="text-v2-dark text-lg font-bold tracking-[-0.02em]">Smart Alerts</h2>

        <div className="mt-4 space-y-3">
          <div className="border-surface-info-border bg-surface-info-bg rounded-2xl border p-4">
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

          <div className="border-surface-warn-border bg-surface-warn-bg rounded-2xl border p-4">
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
          <h2 className="text-v2-dark text-lg font-bold tracking-[-0.02em]">Before You Go</h2>
          <span className="text-brand-primary text-sm font-semibold">View All</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <ProductCard icon={Smartphone} title="Japan eSIM" detail="10GB · 30 Days" price="$18" />
          <ProductCard icon={Shield} title="Travel Insurance" detail="Comprehensive" price="$42" />
        </div>
      </section>
    </AppScreen>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

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
      className="shadow-glass-sm flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white/88 px-4 py-3.5 text-left"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}14` }}
      >
        <Icon className="h-5 w-5" style={{ color }} strokeWidth={2} />
      </div>
      <span className="text-v2-heading flex-1 text-[14px] font-semibold tracking-[-0.01em]">
        {label}
      </span>
      <ChevronRight className="text-v2-icon-muted h-4 w-4" />
    </button>
  );
}

function PrepItem({ icon, label, done }: { icon: string; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm">{icon}</span>
      <span className={`text-sm ${done ? "text-[#3b4658]" : "text-v2-label"}`}>{label}</span>
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
    <div className="shadow-glass-sm rounded-2xl border border-white/80 bg-white/88 p-4">
      <Icon className="text-v2-label h-6 w-6" strokeWidth={1.5} />
      <p className="text-v2-heading mt-3 text-[14px] font-semibold">{title}</p>
      <p className="text-v2-label text-xs">{detail}</p>
      <p className="text-v2-dark mt-2 text-base font-bold">{price}</p>
    </div>
  );
}
