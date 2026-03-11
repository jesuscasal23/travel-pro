"use client";

import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { V2CenteredState } from "@/components/v2/ui/V2CenteredState";
import { useTrips } from "@/hooks/api";
import { useAuthStatus } from "@/hooks/api";
import { V2GradientCard } from "@/components/v2/ui/V2GradientCard";
import { V2IconActionButton } from "@/components/v2/ui/V2IconActionButton";
import { V2PageHeader } from "@/components/v2/ui/V2PageHeader";
import { V2Screen } from "@/components/v2/ui/V2Screen";
import type { TripSummary } from "@/types";

/** Map region to a gradient for visual variety */
function regionGradient(region: string, index: number): string {
  const gradients = [
    "from-amber-800 to-amber-600",
    "from-rose-400 to-sky-400",
    "from-indigo-600 to-purple-500",
    "from-emerald-600 to-teal-400",
    "from-orange-500 to-red-400",
  ];
  return gradients[index % gradients.length];
}

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
          <Loader2 className="text-v2-orange h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && isAuth === false && (
        <V2CenteredState
          title="Sign in to see your trips"
          description="Your trips will appear here after you log in."
          action={
            <button
              onClick={() => router.push("/login?next=/trips")}
              className="bg-v2-orange mt-4 rounded-xl px-6 py-3 text-sm font-bold text-white"
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
              className="bg-v2-orange mt-4 rounded-xl px-6 py-3 text-sm font-bold text-white"
            >
              Plan a Trip
            </button>
          }
        />
      )}

      {!isLoading && tripList.length > 0 && (
        <div className="space-y-6 px-6">
          {tripList.map((trip: TripSummary, index: number) => {
            const days = daysUntil(trip.dateStart);
            const label = trip.destination ?? trip.region;
            return (
              <div key={trip.id}>
                <V2GradientCard
                  gradient={regionGradient(trip.region, index)}
                  className="h-52"
                  onClick={() => router.push(`/trips/${trip.id}`)}
                >
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
                </V2GradientCard>
                <div className="flex items-center justify-end px-1 pt-2">
                  <button
                    onClick={() => router.push(`/trips/${trip.id}`)}
                    className="text-v2-navy flex items-center gap-1 text-xs font-semibold"
                  >
                    OPEN <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </V2Screen>
  );
}
