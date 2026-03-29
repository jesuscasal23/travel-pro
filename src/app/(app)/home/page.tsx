"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/ui/AppLogo";
import {
  ChevronRight,
  BedDouble,
  Plane,
  ClipboardList,
  FileText,
  CheckCircle,
  Circle,
  TrendingDown,
  Cloud,
  CalendarDays,
  Map,
  Bell,
  Shield,
} from "lucide-react";
import {
  useTrips,
  useTrip,
  useBookingClicks,
  useManualBooking,
  useTravelerPreferences,
} from "@/hooks/api";
import { useAuthStatus } from "@/hooks/api/auth/useAuthStatus";
import { AppScreen } from "@/components/ui/AppScreen";
import { useCityImage } from "@/hooks/useCityImage";
import { daysUntil, formatDateRange } from "@/lib/utils/format/date";
import { computeTripPreparation } from "@/lib/utils/trip-preparation";
import { extractHomeAirportIata } from "@/lib/features/profile/traveler-preferences";
import { WhatsNewModal } from "@/components/changelog/WhatsNewModal";
import type { TripSummary, Itinerary } from "@/types";
import type { PrepItem } from "@/lib/utils/trip-preparation";

function getNextTrip(trips: TripSummary[]): TripSummary | null {
  const upcoming = trips
    .filter((t) => daysUntil(t.dateStart) !== null)
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  return upcoming[0] ?? null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const router = useRouter();
  const { trips: tripList, isSuperUser, isLoading } = useTrips();
  const nextTrip = getNextTrip(tripList);
  const destination = nextTrip?.destination ?? "your destination";

  return (
    <AppScreen>
      <WhatsNewModal />

      {/* Super-admin paywall testing pill */}
      {isSuperUser && (
        <button
          onClick={() => router.push("/premium")}
          className="bg-accent/10 text-accent hover:bg-accent/20 flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold transition-colors"
        >
          <Shield className="h-4 w-4" />
          Paywall
        </button>
      )}

      {/* Sticky Header */}
      <header className="dark:bg-card/85 shadow-glass-xs sticky top-0 z-40 bg-white/85 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center justify-center"
            >
              <AppLogo size={40} />
            </button>
            <span className="text-ink font-display text-2xl font-bold tracking-tight">Voya</span>
          </div>
          <button className="text-ink transition-opacity hover:opacity-80">
            <Bell className="h-6 w-6" />
          </button>
        </div>
        <div className="bg-edge h-px w-full" />
      </header>

      <main className="flex flex-col gap-8 px-6 pt-8 pb-8">
        {/* Personalized Greeting */}
        <section>
          <p className="text-label mb-1 text-[11px] font-medium tracking-[0.14em] uppercase">
            Welcome back
          </p>
          <h1 className="text-ink font-display text-[1.75rem] leading-tight font-extrabold">
            {getGreeting()}.
          </h1>
        </section>

        {/* Active Trip Card */}
        {isLoading ? (
          <TripCardSkeleton />
        ) : nextTrip ? (
          <>
            <ActiveTripBento trip={nextTrip} />
            <TripPreparation tripId={nextTrip.id} />
          </>
        ) : (
          <NoTripsCard />
        )}

        {/* Next Steps */}
        <NextSteps destination={destination} />

        {/* Smart Alerts */}
        <SmartAlerts destination={destination} />

        {/* Before You Go */}
        <BeforeYouGo />
      </main>
    </AppScreen>
  );
}

/* ── No Trips Empty State ───────────────────────────────────── */

function NoTripsCard() {
  const router = useRouter();

  return (
    <section>
      <button
        onClick={() => router.push("/plan")}
        className="bg-card border-edge group w-full rounded-3xl border p-8 text-left transition-shadow hover:shadow-lg"
      >
        <div className="mb-4 text-4xl">🌍</div>
        <h2 className="text-ink font-display text-lg font-bold">Your next adventure awaits</h2>
        <p className="text-label mt-1 text-sm leading-relaxed">
          Plan your first trip — pick your destinations and we&apos;ll handle the rest.
        </p>
        <span className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2">
          Start planning <ChevronRight className="h-4 w-4" />
        </span>
      </button>
    </section>
  );
}

/* ── Trip Card Loading Skeleton ─────────────────────────────── */

function TripCardSkeleton() {
  return (
    <section className="animate-pulse">
      <div className="shadow-glass-sm overflow-hidden rounded-[2rem] bg-white dark:bg-white/5">
        {/* Hero image placeholder */}
        <div className="bg-surface-soft relative h-56 w-full">
          <div className="absolute bottom-5 left-6 space-y-2">
            <div className="bg-ink/10 h-5 w-32 rounded-full" />
            <div className="bg-ink/10 h-8 w-48 rounded-lg" />
            <div className="bg-ink/10 h-4 w-28 rounded-lg" />
          </div>
        </div>
        {/* Action buttons placeholder */}
        <div className="flex items-center justify-between gap-3 p-5">
          <div className="flex gap-3">
            <div className="bg-surface-soft h-10 w-28 rounded-xl" />
            <div className="bg-surface-soft h-10 w-24 rounded-xl" />
          </div>
          <div className="bg-surface-soft h-10 w-32 rounded-full" />
        </div>
      </div>
    </section>
  );
}

/* ── Active Trip Bento Card ──────────────────────────────────── */

function ActiveTripBento({ trip }: { trip: TripSummary }) {
  const router = useRouter();
  const cityName = trip.destination ?? trip.region;
  const country = trip.destinationCountry ?? "";
  const countryCode = trip.destinationCountryCode ?? "";
  const [src, onImgError] = useCityImage(cityName, countryCode || undefined);
  const tripId = trip.id;
  const dateRange = formatDateRange(trip.dateStart, trip.dateEnd);

  return (
    <section>
      <div
        role="button"
        tabIndex={0}
        className="group shadow-glass-sm relative overflow-hidden rounded-[2rem] bg-white transition-all"
        onClick={() => router.push(`/trips/${tripId}`)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
            e.preventDefault();
            router.push(`/trips/${tripId}`);
          }
        }}
      >
        {/* Hero Image */}
        <div className="relative h-56 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={cityName}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={onImgError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-5 left-6">
            <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-white uppercase backdrop-blur-md">
              Current Destination
            </span>
            <h2 className="font-display text-[1.75rem] leading-tight font-extrabold text-white">
              {cityName}
              {country ? `, ${country}` : ""}
            </h2>
            <p className="text-sm font-medium text-white/80">{dateRange}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/trips/${tripId}`);
              }}
              className="bg-surface-soft text-ink hover:bg-surface flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            >
              <CalendarDays className="h-4 w-4" />
              Itinerary
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/trips/${tripId}/hotels`);
              }}
              className="bg-surface-soft text-ink hover:bg-surface flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            >
              <BedDouble className="h-4 w-4" />
              Hotels
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/trips/${tripId}/map`);
            }}
            className="from-brand-primary to-app-blue shadow-brand-sm flex items-center gap-2 rounded-full bg-gradient-to-br px-5 py-2.5 font-bold text-white transition-transform hover:scale-[1.02]"
          >
            <Map className="h-4 w-4" />
            View Map
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Trip Preparation ────────────────────────────────────────── */

function PrepItemIcon({ item }: { item: PrepItem }) {
  if (item.beta) return <Shield className="text-label h-5 w-5" />;
  if (item.booked) return <CheckCircle className="text-app-green h-5 w-5" />;
  return <Circle className="text-app-red h-5 w-5" />;
}

function PrepItemTypeIcon({ item }: { item: PrepItem }) {
  if (item.type === "flight") return <Plane className="h-3.5 w-3.5" />;
  if (item.type === "hotel") return <BedDouble className="h-3.5 w-3.5" />;
  return <Shield className="h-3.5 w-3.5" />;
}

function TripPreparation({ tripId }: { tripId: string }) {
  const travelerPreferences = useTravelerPreferences();
  const homeAirport = travelerPreferences.data?.homeAirport ?? "";
  const homeIata = extractHomeAirportIata(homeAirport);
  const isAuthenticated = useAuthStatus();

  const { data: tripDetail } = useTrip(tripId, { enabled: !!tripId });
  const { data: bookingClicks } = useBookingClicks(tripId, {
    enabled: isAuthenticated === true,
  });
  const manualBooking = useManualBooking();

  const itinerary = tripDetail?.itineraries?.find((it) => it.buildStatus === "complete")?.data as
    | Itinerary
    | undefined;
  const route = itinerary?.route ?? [];

  const progress = computeTripPreparation(route, bookingClicks ?? [], homeIata || undefined);

  const handleMarkAsBooked = useCallback(
    (item: PrepItem) => {
      if (item.booked || item.beta) return;

      const metadata: Record<string, unknown> = {};
      if (item.type === "flight" && item.direction) {
        metadata.type = "flight";
        metadata.direction = item.direction;
      } else if (item.type === "hotel" && item.city) {
        metadata.type = "hotel";
        metadata.city = item.city;
      }

      manualBooking.mutate({
        tripId,
        clickType: item.type as "flight" | "hotel",
        city: item.city,
        metadata,
      });
    },
    [tripId, manualBooking]
  );

  // Don't render if no route data yet
  if (route.length === 0) return null;

  return (
    <div className="shadow-glass-sm rounded-[2rem] bg-white p-7">
      <h3 className="font-display mb-5 text-xl font-bold">Trip Preparation</h3>
      <div className="mb-2 flex items-end justify-between">
        <span className="font-display text-brand-primary text-5xl font-extrabold">
          {progress.percentage}
          <span className="text-2xl font-bold">%</span>
        </span>
        <span className="text-label mb-2 text-sm font-medium">
          {progress.completedItems}/{progress.totalItems} completed
        </span>
      </div>
      <div className="bg-surface-soft mb-7 h-3 w-full overflow-hidden rounded-full">
        <div
          className="from-brand-primary to-app-blue h-full rounded-full bg-gradient-to-r transition-all duration-500"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <div className="space-y-3">
        {progress.items.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={item.booked || item.beta || manualBooking.isPending}
            onClick={() => handleMarkAsBooked(item)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
              item.booked || item.beta
                ? "cursor-default"
                : "hover:bg-surface-soft cursor-pointer active:scale-[0.98]"
            }`}
          >
            <PrepItemIcon item={item} />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-muted-foreground">
                <PrepItemTypeIcon item={item} />
              </span>
              <span
                className={`text-sm font-medium ${item.booked ? "text-muted-foreground line-through" : "text-ink"}`}
              >
                {item.label}
              </span>
              {item.beta && (
                <span className="bg-surface-soft text-label rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                  beta
                </span>
              )}
            </div>
            {!item.booked && !item.beta && (
              <span className="text-label text-[10px] font-medium tracking-wider uppercase opacity-50">
                Tap to mark
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Next Steps ──────────────────────────────────────────────── */

function NextSteps({ destination }: { destination: string }) {
  const steps = [
    {
      icon: BedDouble,
      label: `Book accommodation in ${destination}`,
      primary: true,
    },
    { icon: Plane, label: "Upload flight confirmation" },
    { icon: ClipboardList, label: "Finish packing checklist" },
    { icon: FileText, label: "Check visa requirements" },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-label ml-2 text-[11px] font-bold tracking-[0.14em] uppercase opacity-60">
        Next Steps
      </h3>
      {steps.map((step) => (
        <button
          key={step.label}
          type="button"
          className={`group hover:bg-surface-soft shadow-glass-xs flex w-full items-center justify-between rounded-2xl bg-white p-4 transition-colors ${
            step.primary ? "border-brand-primary border-l-4" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                step.primary
                  ? "bg-brand-primary-soft text-brand-primary"
                  : "bg-surface-soft text-dim"
              }`}
            >
              <step.icon className="h-5 w-5" />
            </div>
            <p className="text-ink text-left text-sm leading-tight font-semibold">{step.label}</p>
          </div>
          <ChevronRight className="text-dim h-5 w-5 opacity-30 transition-opacity group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}

/* ── Smart Alerts ────────────────────────────────────────────── */

function SmartAlerts({ destination }: { destination: string }) {
  return (
    <section className="space-y-4">
      <h3 className="font-display text-xl font-bold">Smart Alerts</h3>
      <div className="space-y-3">
        <div className="bg-brand-primary-soft border-brand-primary-border flex items-start gap-4 rounded-2xl border p-4">
          <div className="bg-brand-primary shrink-0 rounded-lg p-2 text-white">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-ink text-sm font-bold">Flights cheaper this week</h4>
            <p className="text-prose mt-0.5 text-sm">
              Save up to $120 on your return leg to London.
            </p>
          </div>
        </div>
        <div className="bg-surface-info-bg border-surface-info-border flex items-start gap-4 rounded-2xl border p-4">
          <div className="bg-app-teal shrink-0 rounded-lg p-2 text-white">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-ink text-sm font-bold">Weather change in {destination}</h4>
            <p className="text-prose mt-0.5 text-sm">
              Expected showers on Wednesday. Pack an umbrella.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Before You Go ───────────────────────────────────────────── */

function BeforeYouGo() {
  const products = [
    {
      title: "Japan eSIM",
      detail: "Unlimited 5G Data \u00b7 15 Days",
      price: "$18.00",
    },
    {
      title: "Travel Insurance",
      detail: "Premium Global Coverage",
      price: "$42.00",
    },
    {
      title: "Luggage Tags",
      detail: "Smart NFC Identification",
      price: "$12.00",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold">Before You Go</h3>
        <button className="text-brand-primary text-[11px] font-bold tracking-[0.14em] uppercase">
          View All
        </button>
      </div>
      <div className="scrollbar-hide -mx-6 flex gap-4 overflow-x-auto px-6 pb-4">
        {products.map((product) => (
          <div
            key={product.title}
            className="shadow-glass-xs border-edge min-w-[200px] rounded-3xl border bg-white p-4"
          >
            <div className="bg-surface-soft mb-3 flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl">
              <span className="text-4xl opacity-20">📦</span>
            </div>
            <div className="mb-1 flex items-start justify-between">
              <h4 className="text-ink text-sm leading-tight font-bold">{product.title}</h4>
              <span className="text-brand-primary text-sm font-bold">{product.price}</span>
            </div>
            <p className="text-label mb-3 text-xs font-medium">{product.detail}</p>
            <button className="bg-surface-soft text-ink hover:bg-surface w-full rounded-xl py-2 text-xs font-bold transition-colors">
              Add to bag
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
