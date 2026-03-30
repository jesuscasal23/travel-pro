"use client";

import { Plus, ChevronRight } from "lucide-react";
import { AppLogo } from "@/components/ui/AppLogo";
import { useRouter } from "next/navigation";
import { CenteredState } from "@/components/ui/CenteredState";
import { useTrips } from "@/hooks/api";
import { AppScreen } from "@/components/ui/AppScreen";
import { TripCard } from "@/components/trip/TripCard";
import { TripActionMenu } from "@/components/trip/TripActionMenu";
import { daysUntil } from "@/lib/utils/format/date";
import { useCityImage } from "@/hooks/useCityImage";
import type { TripSummary } from "@/types";

function PastTripRow({ trip }: { trip: TripSummary }) {
  const router = useRouter();
  const cityName = trip.destination || trip.region;
  const countryCode = trip.destinationCountryCode ?? "";
  const [src, onImgError] = useCityImage(cityName, countryCode || undefined);

  const startDate = new Date(trip.dateStart);
  const dateLabel = startDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="dark:bg-card shadow-card hover:shadow-card-hover flex cursor-pointer items-center gap-4 rounded-xl bg-white p-4 transition-shadow"
      onClick={() => router.push(`/trips/${trip.id}`)}
    >
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={cityName} className="h-full w-full object-cover" onError={onImgError} />
      </div>
      <div className="min-w-0 flex-grow">
        <h4 className="text-foreground truncate font-bold">{cityName}</h4>
        <p className="text-dim text-xs">
          {dateLabel} &bull; {trip.travelers} Traveler{trip.travelers !== 1 ? "s" : ""}
        </p>
      </div>
      <TripActionMenu tripId={trip.id} tripName={cityName} />
    </div>
  );
}

export function TripsPageClient() {
  const router = useRouter();
  const { trips: tripList, isLoading, error } = useTrips();

  const upcoming = tripList.filter((t) => daysUntil(t.dateStart) !== null);
  const past = tripList.filter((t) => daysUntil(t.dateStart) === null);

  return (
    <AppScreen>
      <header className="dark:bg-card/85 shadow-glass-xs sticky top-0 z-40 bg-white/85 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <AppLogo size={40} />
            <h1 className="font-display text-foreground text-2xl font-bold tracking-tight">
              My Trips
            </h1>
          </div>
          <button
            onClick={() => router.push("/plan")}
            className="bg-brand-primary hover:bg-brand-primary/90 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md transition-all duration-150 active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
        <div className="bg-edge h-px w-full" />
      </header>

      <main className="px-6 pt-8">
        <section className="mb-10">
          <p className="text-dim mb-2 text-xs font-semibold tracking-widest uppercase">
            Upcoming Adventures
          </p>
          <h2 className="text-foreground font-display text-3xl font-extrabold tracking-tighter">
            Ready for your next <span className="text-brand-primary">escape?</span>
          </h2>
        </section>

        {isLoading && (
          <div className="animate-pulse space-y-6">
            {/* Upcoming card skeleton */}
            <div className="bg-card border-edge rounded-3xl border p-8">
              <div className="bg-surface-soft mb-4 h-10 w-10 rounded-xl" />
              <div className="bg-surface-soft mb-2 h-5 w-48 rounded-lg" />
              <div className="bg-surface-soft mb-4 h-4 w-64 rounded-lg" />
              <div className="bg-surface-soft h-4 w-28 rounded-lg" />
            </div>
            {/* Past section skeleton */}
            <div>
              <div className="bg-surface-soft mb-6 h-7 w-40 rounded-lg" />
              <div className="bg-card border-edge rounded-3xl border p-8">
                <div className="bg-surface-soft mx-auto mb-4 h-10 w-10 rounded-xl" />
                <div className="bg-surface-soft mx-auto mb-2 h-5 w-40 rounded-lg" />
                <div className="bg-surface-soft mx-auto h-4 w-56 rounded-lg" />
              </div>
            </div>
          </div>
        )}

        {!isLoading && error && (
          <CenteredState title="Failed to load trips. Please try again." tone="error" />
        )}

        {!isLoading && tripList.length === 0 && !error && (
          <div className="space-y-6">
            {/* Upcoming empty card */}
            <button
              onClick={() => router.push("/plan")}
              className="bg-card border-edge group w-full rounded-3xl border p-8 text-left transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 text-4xl">✈️</div>
              <h3 className="text-ink font-display text-lg font-bold">No upcoming trips yet</h3>
              <p className="text-label mt-1 text-sm leading-relaxed">
                Plan your next adventure — pick your destinations and we&apos;ll handle the rest.
              </p>
              <span className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2">
                Start planning <ChevronRight className="h-4 w-4" />
              </span>
            </button>

            {/* Past adventures empty card */}
            <section>
              <h3 className="font-display mb-6 text-2xl font-bold">Past Adventures</h3>
              <div className="bg-card border-edge rounded-3xl border p-8 text-center">
                <div className="mb-4 text-4xl">🗺️</div>
                <h4 className="text-ink font-display text-lg font-bold">No past adventures</h4>
                <p className="text-label mt-1 text-sm leading-relaxed">
                  Your completed trips will appear here.
                </p>
              </div>
            </section>
          </div>
        )}

        {!isLoading && tripList.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6">
              {upcoming.map((trip) => {
                const days = daysUntil(trip.dateStart);
                const label = trip.destination || trip.region;
                return (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    label={label}
                    days={days}
                    onClick={() => router.push(`/trips/${trip.id}`)}
                    actions={<TripActionMenu tripId={trip.id} tripName={label} />}
                  />
                );
              })}
            </div>

            {past.length > 0 && (
              <section className="mt-16 mb-8">
                <h3 className="font-display mb-6 text-2xl font-bold">Past Adventures</h3>
                <div className="flex flex-col gap-4">
                  {past.map((trip) => (
                    <PastTripRow key={trip.id} trip={trip} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </AppScreen>
  );
}
