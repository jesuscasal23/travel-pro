"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { V2CenteredState } from "@/components/v2/ui/V2CenteredState";
import { useTrips } from "@/hooks/api";
import { useAuthStatus } from "@/hooks/api";
import { V2IconActionButton } from "@/components/v2/ui/V2IconActionButton";
import { V2PageHeader } from "@/components/v2/ui/V2PageHeader";
import { V2Screen } from "@/components/v2/ui/V2Screen";
import { getCityImage, getCityPlaceholder } from "@/lib/utils/city-images";
import type { TripSummary } from "@/types";

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}

function daysUntil(dateStr: string): number | null {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export default function TripsPage() {
  const router = useRouter();
  const isAuth = useAuthStatus();
  const { data: trips, isLoading, error } = useTrips();

  const tripList = trips ?? [];

  return (
    <V2Screen>
      <V2PageHeader
        title="My Trips"
        description={
          isLoading ? "Loading..." : `${tripList.length} trip${tripList.length !== 1 ? "s" : ""}`
        }
        action={
          <V2IconActionButton
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

      {!isLoading && isAuth === false && (
        <V2CenteredState
          title="Sign in to see your trips"
          description="Your trips will appear here after you log in."
          action={
            <button
              onClick={() => router.push("/login?next=/trips")}
              className="bg-brand-primary mt-4 rounded-xl px-6 py-3 text-sm font-bold text-white"
            >
              Sign In
            </button>
          }
        />
      )}

      {!isLoading && error && (
        <V2CenteredState title="Failed to load trips. Please try again." tone="error" />
      )}

      {!isLoading && isAuth && tripList.length === 0 && !error && (
        <V2CenteredState
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
            const label = trip.destination ?? trip.region;
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
    </V2Screen>
  );
}

function TripCard({
  trip,
  label,
  days,
  onClick,
}: {
  trip: TripSummary;
  label: string;
  days: number | null;
  onClick: () => void;
}) {
  const cityName = trip.destination ?? label;
  const countryCode = trip.destinationCountryCode ?? "";
  const [src, setSrc] = useState(() =>
    countryCode ? getCityImage(cityName, countryCode) : getCityPlaceholder(cityName)
  );

  return (
    <div className="relative h-52 cursor-pointer overflow-hidden rounded-2xl" onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setSrc(getCityPlaceholder(cityName))}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

      <div className="absolute top-3 right-3">
        <span className="bg-v2-navy/80 rounded-full px-2.5 py-1 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
          {days ? `${days} DAYS AWAY` : "PLANNED"}
        </span>
      </div>
      <p className="absolute bottom-12 left-5 text-xl font-bold text-white">{label}</p>
      <div className="absolute bottom-4 left-5 flex items-center gap-2">
        <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
          {formatDateRange(trip.dateStart, trip.dateEnd)}
        </span>
        <span className="text-xs text-white/60">&bull;</span>
        <span className="text-xs text-white/80">
          {trip.travelers} traveler{trip.travelers !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
