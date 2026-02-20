"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Compass, MapPin, Plane, Plus, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button, EmptyState, SkeletonCard } from "@/components/ui";
import { useTripStore } from "@/stores/useTripStore";
import { statusBadge, statusLabel } from "@/lib/utils/status-helpers";
import { useTrips } from "@/hooks/api";

const gradients = [
  "from-primary/80 to-primary/40",
  "from-accent/80 to-accent/40",
  "from-purple-600/80 to-purple-400/40",
  "from-emerald-600/80 to-emerald-400/40",
];

export default function DashboardPage() {
  const displayName = useTripStore((s) => s.displayName) || "Explorer";

  const { data: trips = [], isLoading: loading, error, refetch } = useTrips();
  const isEmpty = !loading && !error && trips.length === 0;

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
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertTriangle className="w-8 h-8 text-accent" />
              <p className="text-foreground font-medium">Couldn&apos;t load your trips</p>
              <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
              <Button size="sm" variant="ghost" onClick={() => refetch()} className="gap-1.5 mt-1">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </Button>
            </div>
          )}

          {isEmpty && (
            <EmptyState
              icon="✈️"
              title="No trips yet"
              description="Plan your first AI-crafted trip in minutes."
              action={
                <Link href="/plan" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Start planning
                </Link>
              }
            />
          )}

          {!loading && !isEmpty && (
            <div className="grid sm:grid-cols-2 gap-6">
              {trips.map((trip, i) => {
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
