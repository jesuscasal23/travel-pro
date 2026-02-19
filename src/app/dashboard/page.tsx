"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, MapPin, Plane, Plus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useTripStore } from "@/stores/useTripStore";
import { statusBadge, statusLabel } from "@/lib/utils/status-helpers";

interface TripSummary {
  id: string;
  region: string;
  tripType?: "single-city" | "multi-city";
  destination?: string;
  destinationCountry?: string;
  dateStart: string;
  dateEnd: string;
  budget: number;
  travelers: number;
  createdAt: string;
  itineraries: { id: string; generationStatus: string }[];
}

const gradients = [
  "from-primary/80 to-primary/40",
  "from-accent/80 to-accent/40",
  "from-purple-600/80 to-purple-400/40",
  "from-emerald-600/80 to-emerald-400/40",
];

export default function DashboardPage() {
  const displayName = useTripStore((s) => s.displayName) || "Explorer";

  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      try {
        const res = await fetch("/api/v1/trips");
        if (res.ok) {
          const data = await res.json();
          setTrips(data.trips ?? []);
        } else {
          // Fall back to sample data in demo mode
          setTrips(null);
        }
      } catch {
        setTrips(null);
      } finally {
        setLoading(false);
      }
    }
    loadTrips();
  }, []);

  const displayTrips = trips ?? [];
  const isEmpty = !loading && displayTrips.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated displayName={displayName} />

      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {displayName}.
          </h1>
          <p className="text-muted-foreground mt-1">Ready for your next adventure?</p>
        </motion.div>

        {/* Plan New Trip CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-10"
        >
          <Link
            href="/plan"
            className="block w-full max-w-md mx-auto text-center bg-primary text-primary-foreground rounded-2xl py-6 px-8 hover:scale-[1.02] transition-all group"
            style={{ boxShadow: "var(--shadow-hero)" }}
          >
            <Compass className="w-10 h-10 mx-auto mb-3 group-hover:rotate-45 transition-transform duration-500" />
            <span className="text-xl font-semibold">Plan a New Trip</span>
          </Link>
        </motion.div>

        {/* Trips Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-14"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">Your Trips</h2>

          {loading && (
            <div className="grid sm:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-secondary animate-pulse" />
              ))}
            </div>
          )}

          {isEmpty && (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No trips yet</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Plan your first AI-crafted trip in minutes.
              </p>
              <Link href="/plan" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Start planning
              </Link>
            </div>
          )}

          {!loading && !isEmpty && (
            <div className="grid sm:grid-cols-2 gap-6">
              {displayTrips.map((trip, i) => {
                const itinerary = trip.itineraries?.[0];
                const status = itinerary?.generationStatus ?? "pending";
                const tripId = trip.id;

                return (
                  <Link
                    key={trip.id}
                    href={`/trip/${tripId}`}
                    className="group block"
                  >
                    <div
                      className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${gradients[i % gradients.length]} h-48 hover:-translate-y-1 transition-all duration-300`}
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      <div className="absolute inset-0 bg-foreground/10" />
                      <div className="relative h-full flex flex-col justify-between p-6 text-primary-foreground">
                        <span className={`${statusBadge(status)} self-start`}>
                          {statusLabel(status)}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold">
                            {trip.tripType === "single-city" && trip.destination
                              ? `${trip.destination}${trip.destinationCountry ? `, ${trip.destinationCountry}` : ""}`
                              : trip.region}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {trip.travelers} travellers
                            </span>
                            <span className="flex items-center gap-1">
                              <Plane className="w-3.5 h-3.5" />
                              {trip.dateStart}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
