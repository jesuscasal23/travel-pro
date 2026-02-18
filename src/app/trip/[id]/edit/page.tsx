"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, GripVertical, Minus, Plus, X, Save } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useItinerary } from "@/hooks/useItinerary";
import type { CityStop } from "@/types";

type Params = Promise<{ id: string }>;

export default function EditPage({ params }: { params: Params }) {
  const { id } = use(params);
  const itinerary = useItinerary();

  // Local copy of cities — modifications don't persist for Phase 0
  const [cities, setCities] = useState<CityStop[]>([...itinerary.route]);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  const updateDays = (cityId: string, delta: number) => {
    setCities((prev) =>
      prev.map((c) =>
        c.id === cityId ? { ...c, days: Math.max(1, c.days + delta) } : c
      )
    );
  };

  const removeCity = (cityId: string) => {
    setCities((prev) => prev.filter((c) => c.id !== cityId));
    if (expandedCity === cityId) setExpandedCity(null);
  };

  const toggleExpanded = (city: string) => {
    setExpandedCity((prev) => (prev === city ? null : city));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      {/* Fixed top bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/trip/${id}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-foreground">Edit Trip</h1>
            <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-xs font-medium">
              Edit Mode
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[7.5rem] pb-32 max-w-3xl mx-auto px-4">

        {/* City list wrapped in sky-blue border */}
        <div className="border-2 border-sky-200 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Route Cities</h2>

          <div className="space-y-3">
            {cities.map((city, i) => (
              <motion.div
                key={city.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card-travel bg-background flex items-center gap-4 group">
                  {/* Drag handle — visual only for Phase 0 */}
                  <GripVertical className="w-5 h-5 text-muted-foreground/50 cursor-grab flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    {/* City header — click to expand */}
                    <button
                      onClick={() => toggleExpanded(city.city)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-foreground">{city.city}</span>
                        <span className="text-muted-foreground text-sm">
                          {city.country} · {city.days} day{city.days !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </button>

                    {/* Expandable day count stepper */}
                    {expandedCity === city.city && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border">
                          <label className="text-sm font-medium text-foreground mb-3 block">
                            Number of days
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateDays(city.id, -1)}
                              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-xl font-bold text-primary w-8 text-center">
                              {city.days}
                            </span>
                            <button
                              onClick={() => updateDays(city.id, +1)}
                              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Remove button — appears on hover */}
                  <button
                    onClick={() => removeCity(city.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 hover:bg-accent/10 transition-all flex-shrink-0"
                    aria-label={`Remove ${city.city}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Add city placeholder */}
            <button className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Plus className="w-6 h-6 mx-auto mb-1" />
              <span className="text-sm font-medium">Add a city</span>
            </button>
          </div>
        </div>

        {/* Budget Impact Panel */}
        <div className="mt-8 card-travel bg-background">
          <h3 className="font-semibold text-foreground mb-4">Budget Impact</h3>
          <div className="space-y-2">
            {(Object.entries(itinerary.budget) as [string, number][])
              .filter(([k]) => k !== "total" && k !== "budget")
              .map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{k}</span>
                  <span className="font-medium text-accent">€{v.toLocaleString()}</span>
                </div>
              ))}
          </div>
          <div className="pt-3 mt-2 border-t border-border flex justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-accent">€{itinerary.budget.total.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Budget figures will update when you save changes.
          </p>
        </div>
      </div>

      {/* Floating action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
          <Link href={`/trip/${id}`} className="btn-ghost text-sm py-2 px-4">
            Cancel
          </Link>
          <Link
            href={`/trip/${id}`}
            className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save Changes
          </Link>
        </div>
      </div>
    </div>
  );
}
