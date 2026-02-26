"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Compass, MapPin, Plane, Plus, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button, EmptyState, SkeletonCard } from "@/components/ui";
import { statusBadge, statusLabel } from "@/lib/utils/status-helpers";
import { useTrips } from "@/hooks/api";

const gradients = [
  "from-primary/80 to-primary/40",
  "from-accent/80 to-accent/40",
  "from-purple-600/80 to-purple-400/40",
  "from-emerald-600/80 to-emerald-400/40",
];

export default function DashboardPage() {
  const { data: trips = [], isLoading: loading, error, refetch } = useTrips();
  const isEmpty = !loading && !error && trips.length === 0;

  return (
    <div className="bg-background min-h-screen">
      <Navbar isAuthenticated />

      <div className="mx-auto max-w-5xl px-4 pt-24 pb-16">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-foreground text-3xl font-bold">Welcome back.</h1>
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
            className="bg-primary text-primary-foreground group mx-auto block w-full max-w-md rounded-2xl px-8 py-6 text-center transition-all hover:scale-[1.02]"
            style={{ boxShadow: "var(--shadow-hero)" }}
          >
            <Compass className="mx-auto mb-3 h-10 w-10 transition-transform duration-500 group-hover:rotate-45" />
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
          <h2 className="text-foreground mb-6 text-xl font-semibold">Your Trips</h2>

          {loading && (
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertTriangle className="text-accent h-8 w-8" />
              <p className="text-foreground font-medium">Couldn&apos;t load your trips</p>
              <p className="text-muted-foreground text-sm">Check your connection and try again.</p>
              <Button size="sm" variant="ghost" onClick={() => refetch()} className="mt-1 gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
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
                  <Plus className="h-4 w-4" />
                  Start planning
                </Link>
              }
            />
          )}

          {!loading && !isEmpty && (
            <div className="grid gap-6 sm:grid-cols-2">
              {trips.map((trip, i) => {
                const itinerary = trip.itineraries?.[0];
                const status = itinerary?.generationStatus ?? "pending";
                const tripId = trip.id;

                return (
                  <Link key={trip.id} href={`/trip/${tripId}`} className="group block">
                    <div
                      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} h-48 transition-all duration-300 hover:-translate-y-1`}
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      <div className="bg-foreground/10 absolute inset-0" />
                      <div className="text-primary-foreground relative flex h-full flex-col justify-between p-6">
                        <span className={`${statusBadge(status)} self-start`}>
                          {statusLabel(status)}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold">
                            {trip.tripType === "single-city" && trip.destination
                              ? `${trip.destination}${trip.destinationCountry ? `, ${trip.destinationCountry}` : ""}`
                              : trip.region}
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-sm opacity-90">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {trip.travelers} travellers
                            </span>
                            <span className="flex items-center gap-1">
                              <Plane className="h-3.5 w-3.5" />
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
