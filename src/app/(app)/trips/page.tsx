"use client";

import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CenteredState } from "@/components/ui/CenteredState";
import { useTrips } from "@/hooks/api";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppScreen } from "@/components/ui/AppScreen";
import { TripCard } from "@/components/trip/TripCard";
import { daysUntil } from "@/lib/utils/format/date";
import type { TripSummary } from "@/types";

export default function TripsPage() {
  const router = useRouter();
  const { data: trips, isLoading, error } = useTrips();

  const tripList = trips ?? [];

  return (
    <AppScreen>
      <PageHeader
        title="My Trips"
        description={
          isLoading ? "Loading..." : `${tripList.length} trip${tripList.length !== 1 ? "s" : ""}`
        }
        action={
          <IconActionButton
            onClick={() => router.push("/plan")}
            icon={<Plus size={20} className="text-white" />}
          />
        }
      />

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
        <div className="space-y-6 px-6">
          {tripList.map((trip: TripSummary) => {
            const days = daysUntil(trip.dateStart);
            const label = trip.destination || trip.region;
            return (
              <TripCard
                key={trip.id}
                trip={trip}
                label={label}
                days={days}
                onClick={() => router.push(`/trips/${trip.id}`)}
              />
            );
          })}
        </div>
      )}
    </AppScreen>
  );
}
