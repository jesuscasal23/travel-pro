"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, MapPin, Plane } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useTripStore } from "@/stores/useTripStore";
import { sampleTrips } from "@/data/sampleData";
import type { SavedTrip } from "@/types";

const statusColors: Record<SavedTrip["status"], string> = {
  Ready: "badge-success",
  Planning: "badge-warning",
  Completed: "badge-info",
};

export default function DashboardPage() {
  const displayName = useTripStore((s) => s.displayName) || "Thomas";

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated displayName={displayName} />

      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {displayName}.
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready for your next adventure?
          </p>
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
            className="block w-full max-w-md mx-auto text-center bg-primary text-primary-foreground
              rounded-2xl py-6 px-8 hover:scale-[1.02] transition-all group"
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
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Your Trips
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {sampleTrips.map((trip, i) => (
              <Link
                key={trip.id}
                href={`/trip/${trip.id}`}
                className="group block"
              >
                <div
                  className={`relative rounded-xl overflow-hidden bg-gradient-to-br
                    ${
                      i === 0
                        ? "from-primary/80 to-primary/40"
                        : "from-accent/80 to-accent/40"
                    }
                    h-48 hover:-translate-y-1 transition-all duration-300`}
                  style={{
                    boxShadow:
                      "var(--shadow-card), 0 0 0 0 transparent",
                  }}
                >
                  <div className="absolute inset-0 bg-foreground/10" />
                  <div className="relative h-full flex flex-col justify-between p-6 text-primary-foreground">
                    <span className={`${statusColors[trip.status]} self-start`}>
                      {trip.status}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold">{trip.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {trip.countries} countries
                        </span>
                        <span className="flex items-center gap-1">
                          <Plane className="w-3.5 h-3.5" />
                          {trip.dates}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
