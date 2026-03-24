"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Loader2, Star, Trash2 } from "lucide-react";
import { AppLogo } from "@/components/ui/AppLogo";
import { useRouter } from "next/navigation";
import { CenteredState } from "@/components/ui/CenteredState";
import { useTrips, useProfile, useDeleteAdminTrip } from "@/hooks/api";
import { AppScreen } from "@/components/ui/AppScreen";
import { TripCard } from "@/components/trip/TripCard";
import { daysUntil } from "@/lib/utils/format/date";
import { useCityImage } from "@/hooks/useCityImage";
import type { TripSummary } from "@/types";

function PastTripRow({ trip, isSuperAdmin }: { trip: TripSummary; isSuperAdmin: boolean }) {
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
      {isSuperAdmin ? (
        <div onClick={(e) => e.stopPropagation()}>
          <AdminDeleteButton tripId={trip.id} tripName={cityName} />
        </div>
      ) : (
        <Star className="text-faint h-5 w-5 flex-shrink-0" fill="currentColor" />
      )}
    </div>
  );
}

function AdminDeleteButton({ tripId, tripName }: { tripId: string; tripName: string }) {
  const [confirming, setConfirming] = useState(false);
  const deleteTrip = useDeleteAdminTrip();
  const renderModal = () => {
    if (!confirming) return null;
    const container = document.getElementById("app-container");
    if (!container) return null;
    return createPortal(
      <div className="absolute inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setConfirming(false)}
        />
        <div className="relative z-10 mx-6 w-full max-w-xs rounded-2xl border border-white/70 bg-white/95 p-5 shadow-xl backdrop-blur-xl">
          <h3 className="text-foreground text-base font-bold">Delete trip</h3>
          <p className="text-dim mt-2 text-sm">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">&ldquo;{tripName}&rdquo;</strong>? This action
            cannot be undone.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                deleteTrip.mutate(tripId);
                setConfirming(false);
              }}
              disabled={deleteTrip.isPending}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {deleteTrip.isPending ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="bg-surface-soft text-foreground hover:bg-surface-hover flex-1 rounded-xl px-4 py-2.5 text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>,
      container
    );
  };

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20"
        title="Delete trip (admin)"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {renderModal()}
    </>
  );
}

export function TripsPageClient() {
  const router = useRouter();
  const { data: trips, isLoading, error } = useTrips();
  const { data: profile } = useProfile();
  const isSuperAdmin = profile?.isSuperUser === true;

  const tripList = trips ?? [];

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
          <div className="flex items-center justify-center py-20">
            <Loader2 className="text-brand-primary h-8 w-8 animate-spin" />
          </div>
        )}

        {!isLoading && error && (
          <CenteredState title="Failed to load trips. Please try again." tone="error" />
        )}

        {!isLoading && tripList.length === 0 && !error && (
          <CenteredState
            title="No trips yet"
            description="Plan your first adventure!"
            action={
              <button
                onClick={() => router.push("/plan")}
                className="bg-brand-primary mt-4 rounded-xl px-6 py-3 text-sm font-bold text-white"
              >
                Plan a Trip
              </button>
            }
          />
        )}

        {!isLoading && tripList.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6">
              {upcoming.map((trip) => {
                const days = daysUntil(trip.dateStart);
                const label = trip.destination || trip.region;
                return (
                  <div key={trip.id} className="relative">
                    <TripCard
                      trip={trip}
                      label={label}
                      days={days}
                      onClick={() => router.push(`/trips/${trip.id}`)}
                    />
                    {isSuperAdmin && (
                      <div
                        className="absolute right-16 bottom-6 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AdminDeleteButton tripId={trip.id} tripName={label} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {past.length > 0 && (
              <section className="mt-16 mb-8">
                <h3 className="font-display mb-6 text-2xl font-bold">Past Adventures</h3>
                <div className="flex flex-col gap-4">
                  {past.map((trip) => (
                    <PastTripRow key={trip.id} trip={trip} isSuperAdmin={isSuperAdmin} />
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
