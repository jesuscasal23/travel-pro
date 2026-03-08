"use client";

import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/v2/ui/BottomNav";
import { useTrips } from "@/hooks/api";
import { useAuthStatus } from "@/hooks/api";
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
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-8 pb-4">
          <div>
            <h1 className="text-v2-navy text-2xl font-bold">My Trips</h1>
            <p className="text-v2-text-muted text-sm">
              {isLoading
                ? "Loading..."
                : `${tripList.length} trip${tripList.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => router.push("/plan")}
            className="bg-v2-navy flex h-10 w-10 items-center justify-center rounded-full"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="text-v2-orange h-8 w-8 animate-spin" />
          </div>
        )}

        {!isLoading && isAuth === false && (
          <div className="px-6 py-16 text-center">
            <p className="text-v2-navy text-lg font-bold">Sign in to see your trips</p>
            <p className="text-v2-text-muted mt-1 text-sm">
              Your trips will appear here after you log in.
            </p>
            <button
              onClick={() => router.push("/login?next=/trips")}
              className="bg-v2-orange mt-4 rounded-xl px-6 py-3 text-sm font-bold text-white"
            >
              Sign In
            </button>
          </div>
        )}

        {!isLoading && error && (
          <div className="px-6 py-16 text-center">
            <p className="text-v2-red text-sm">Failed to load trips. Please try again.</p>
          </div>
        )}

        {!isLoading && isAuth && tripList.length === 0 && !error && (
          <div className="px-6 py-16 text-center">
            <p className="text-v2-navy text-lg font-bold">No trips yet</p>
            <p className="text-v2-text-muted mt-1 text-sm">Plan your first adventure!</p>
            <button
              onClick={() => router.push("/plan")}
              className="bg-v2-orange mt-4 rounded-xl px-6 py-3 text-sm font-bold text-white"
            >
              Plan a Trip
            </button>
          </div>
        )}

        {!isLoading && tripList.length > 0 && (
          <div className="space-y-6 px-6">
            {tripList.map((trip: TripSummary, index: number) => {
              const days = daysUntil(trip.dateStart);
              const label = trip.destination ?? trip.region;
              return (
                <div key={trip.id}>
                  <div
                    className={`relative h-52 cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br ${regionGradient(trip.region, index)}`}
                    onClick={() => router.push(`/trip/${trip.id}`)}
                  >
                    <div className="absolute right-0 bottom-0 left-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className="bg-v2-navy/80 rounded-full px-2.5 py-1 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
                        {days ? `${days} DAYS AWAY` : "PLANNED"}
                      </span>
                    </div>
                    <p className="absolute bottom-12 left-5 text-xl font-bold text-white">
                      {label}
                    </p>
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
                  <div className="flex items-center justify-end px-1 pt-2">
                    <button
                      onClick={() => router.push(`/trip/${trip.id}`)}
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
      </div>

      <BottomNav />
    </div>
  );
}
