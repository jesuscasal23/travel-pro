"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ShieldCheck,
  Plane,
  Wallet,
  Shield,
  Package,
  AlertCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { BottomNav } from "@/components/v2/ui/BottomNav";
import { useTrips, useAuthStatus } from "@/hooks/api";
import { createClient } from "@/lib/supabase/client";
import { mockDepartureTasks } from "@/data/v2-mock-data";
import type { TripSummary } from "@/types";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning,";
  if (h < 18) return "Good Afternoon,";
  return "Good Evening,";
}

function daysUntil(dateStr: string): number | null {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export default function HomePage() {
  const router = useRouter();
  const isAuth = useAuthStatus();
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const [displayName, setDisplayName] = useState("Traveler");

  // Fetch user's display name from Supabase
  useEffect(() => {
    async function loadName() {
      const supabase = createClient();
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const name =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split("@")[0] ??
          "Traveler";
        setDisplayName(name);
      }
    }
    if (isAuth) void loadName();
  }, [isAuth]);

  // Find the nearest upcoming trip
  const nextTrip: TripSummary | null =
    trips
      ?.filter((t) => daysUntil(t.dateStart) !== null)
      .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())[0] ?? null;

  const nextTripDays = nextTrip ? daysUntil(nextTrip.dateStart) : null;
  const nextTripLabel = nextTrip?.destination ?? nextTrip?.region ?? "Upcoming Trip";

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-8 pb-4">
          <div>
            <p className="text-v2-text-muted text-sm">{getGreeting()}</p>
            <h1 className="text-v2-navy text-2xl font-bold">{displayName}</h1>
          </div>
          <div
            className="bg-v2-surface flex h-10 w-10 cursor-pointer items-center justify-center rounded-full"
            onClick={() => router.push("/profile")}
          >
            <span className="text-lg">👤</span>
          </div>
        </div>

        {/* Next Trip Card */}
        {tripsLoading ? (
          <div className="mx-6 flex h-48 items-center justify-center rounded-2xl bg-gray-50">
            <Loader2 className="text-v2-orange h-8 w-8 animate-spin" />
          </div>
        ) : nextTrip ? (
          <div
            className="relative mx-6 h-48 cursor-pointer overflow-hidden rounded-2xl"
            onClick={() => router.push(`/trip/${nextTrip.id}`)}
          >
            <div className="from-v2-navy to-v2-navy-light absolute inset-0 bg-gradient-to-br" />
            <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-v2-orange rounded-full px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                    NEXT TRIP
                  </span>
                  {nextTripDays && (
                    <span className="flex items-center gap-1 text-xs opacity-80">
                      <Calendar size={12} />
                      {nextTripDays} days away
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xl font-bold">{nextTripLabel}</p>
              <div className="flex gap-2">
                <div className="flex flex-col items-center gap-1 rounded-lg bg-white/20 px-3 py-2 backdrop-blur-sm">
                  <ShieldCheck size={14} className="text-green-300" />
                  <span className="text-[10px]">VISA</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-white/20 px-3 py-2 backdrop-blur-sm">
                  <Plane size={14} className="text-blue-300" />
                  <span className="text-[10px]">FLIGHT</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-white/20 px-3 py-2 backdrop-blur-sm">
                  <Wallet size={14} className="text-orange-300" />
                  <span className="text-[10px]">BUDGET</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-6 flex h-48 flex-col items-center justify-center rounded-2xl bg-gray-50">
            <p className="text-v2-navy font-bold">No upcoming trips</p>
            <p className="text-v2-text-muted mt-1 text-sm">Plan your first adventure!</p>
            <button
              onClick={() => router.push("/plan")}
              className="bg-v2-orange mt-3 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            >
              Plan a Trip
            </button>
          </div>
        )}

        {/* Info Cards Row */}
        <div className="mt-4 grid grid-cols-2 gap-3 px-6">
          <div className="border-v2-border rounded-xl border p-4">
            <Shield size={20} className="text-v2-green" />
            <p className="text-v2-navy mt-2 text-sm font-semibold">Risk Scanner</p>
            <p className="text-v2-text-muted text-xs">Safety Score: 98/100</p>
            <p className="text-v2-blue mt-1 text-xs font-medium">View Report &rarr;</p>
          </div>
          <div className="border-v2-border rounded-xl border p-4">
            <Package size={20} className="text-v2-purple" />
            <p className="text-v2-navy mt-2 text-sm font-semibold">Essentials</p>
            <p className="text-v2-text-muted text-xs">eSIM, Insurance, etc.</p>
            <p className="text-v2-orange mt-1 text-xs font-medium">Bundle Checkout &rarr;</p>
          </div>
        </div>

        {/* Prepare for Departure — stays mock for now */}
        <div className="mt-6 px-6">
          <h2 className="text-v2-navy mb-3 text-lg font-bold">Prepare for Departure</h2>
          {mockDepartureTasks.map((task) => (
            <div
              key={task.id}
              className="border-v2-border mb-3 flex items-center gap-4 rounded-xl border p-4"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  task.type === "packing" ? "bg-red-50" : "bg-blue-50"
                }`}
              >
                {task.type === "packing" ? (
                  <AlertCircle size={20} className="text-v2-red" />
                ) : (
                  <Plane size={20} className="text-v2-blue" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-v2-navy text-sm font-semibold">{task.title}</p>
                <p className="text-v2-text-muted text-xs">{task.subtitle}</p>
              </div>
              <ChevronRight size={18} className="text-v2-text-light" />
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
