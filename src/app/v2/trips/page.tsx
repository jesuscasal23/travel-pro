"use client";

import { Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/v2/ui/BottomNav";

const mockTrips = [
  {
    id: "trip-1",
    title: "Euro-Asia Grand Tour",
    cities: ["Madrid", "Bali", "Singapore"],
    dates: "Oct 1 - Oct 30",
    daysAway: 14,
    travelers: 2,
    imageGradient: "from-amber-800 to-amber-600",
    badge: "14 DAYS AWAY",
    badgeBg: "bg-v2-navy/80",
  },
  {
    id: "trip-2",
    title: "Italian Summer",
    cities: ["Amalfi Coast, Italy"],
    dates: "Aug 10 – Aug 24",
    daysAway: null,
    travelers: 2,
    imageGradient: "from-rose-400 to-sky-400",
    badge: "PLANNED",
    badgeBg: "bg-teal-600/80",
  },
];

export default function TripsPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-8 pb-4">
          <div>
            <h1 className="text-v2-navy text-2xl font-bold">My Trips</h1>
            <p className="text-v2-text-muted text-sm">2 upcoming adventures</p>
          </div>
          <button className="bg-v2-navy flex h-10 w-10 items-center justify-center rounded-full">
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Trip Cards */}
        <div className="space-y-6 px-6">
          {mockTrips.map((trip) => (
            <div key={trip.id}>
              {/* Image Card */}
              <div
                className={`relative h-52 overflow-hidden rounded-2xl bg-gradient-to-br ${trip.imageGradient}`}
              >
                {/* Dark gradient overlay */}
                <div className="absolute right-0 bottom-0 left-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold text-white uppercase backdrop-blur-sm ${trip.badgeBg}`}
                  >
                    {trip.badge}
                  </span>
                </div>

                {/* City names */}
                <p className="absolute bottom-12 left-5 text-xl font-bold text-white">
                  {trip.cities.join(" — ")}
                </p>

                {/* Bottom info */}
                <div className="absolute bottom-4 left-5 flex items-center gap-2">
                  <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                    {trip.dates}
                  </span>
                  <span className="text-xs text-white/60">&bull;</span>
                  <span className="text-xs text-white/80">{trip.title}</span>
                </div>
              </div>

              {/* Below image card */}
              <div className="flex items-center justify-between px-1 pt-2">
                {/* Traveler avatars */}
                <div className="flex items-center">
                  <div className="bg-v2-navy/20 h-7 w-7 rounded-full border-2 border-white" />
                  <div className="bg-v2-navy/20 -ml-2 h-7 w-7 rounded-full border-2 border-white" />
                  <span className="text-v2-text-muted ml-1 text-xs">+{trip.travelers}</span>
                </div>

                {/* Open link */}
                <button className="text-v2-navy flex items-center gap-1 text-xs font-semibold">
                  OPEN OS <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
