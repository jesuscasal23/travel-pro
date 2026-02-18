"use client";

import { use, useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Edit3, LayoutList, ChevronUp, ChevronDown, Clock, Plane, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { Navbar } from "@/components/Navbar";
import { useItinerary } from "@/hooks/useItinerary";
import RouteMapFallback from "@/components/map/RouteMapFallback";
import { useTripStore } from "@/stores/useTripStore";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import { getBudgetStatus } from "@/lib/utils/trip-metadata";
import type { CityStop, ItineraryFlightLeg } from "@/types";
import type { FlightSkeleton } from "@/lib/flights/types";

// Mapbox map loaded only on the client — mapbox-gl does not support SSR
const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground">
      Loading map...
    </div>
  ),
});

// City → timeline dot color based on country
const getCityColor = (city: string, route: CityStop[]): string => {
  const stop = route.find((r) => r.city === city);
  if (!stop) return "bg-primary";
  const countries = [...new Set(route.map((r) => r.country))];
  const countryIdx = countries.indexOf(stop.country);
  return countryIdx % 2 === 0 ? "bg-primary" : "bg-accent";
};

type Params = Promise<{ id: string }>;

export default function TripPage({ params }: { params: Params }) {
  const { id } = use(params);
  const itinerary = useItinerary();
  // Extract array fields early (before hooks) with safe defaults for hook dependencies
  const route = itinerary?.route ?? [];
  const days = itinerary?.days ?? [];

  const { homeAirport, dateStart, dateEnd, travelers, setItinerary } = useTripStore();

  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const [activeCityIndex, setActiveCityIndex] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"visa" | "weather" | "budget">("visa");
  const [optimizeState, setOptimizeState] = useState<"idle" | "loading" | "result" | "applied">(
    itinerary?.flightLegs ? "applied" : "idle"
  );
  const [optimizeResult, setOptimizeResult] = useState<FlightSkeleton | null>(null);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    posthog?.capture("itinerary_viewed", { trip_id: id, city_count: route.length });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Derive trip metadata from itinerary
  const countries = [...new Set(route.map((r) => r.country))];
  const tripTitle = countries.join(", ");
  const totalDays = days.length;

  // Map pin click → set active city + scroll timeline to first day of that city
  const handleCityClick = useCallback((index: number) => {
    setActiveCityIndex(index);
    const city = route[index]?.city;
    const dayIndex = days.findIndex((d) => d.city === city);
    if (dayIndex >= 0) {
      dayRefs.current[dayIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [route, days]);

  // Early return for null itinerary — all hooks must be called above this line
  if (!itinerary) {
    return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
  }

  const { budget, visaData, weatherData, flightLegs } = itinerary;

  // Savings from optimization (used in result card)
  const optimizeSaved =
    optimizeResult?.baselineCost && optimizeResult.totalFlightCost > 0
      ? Math.round(optimizeResult.baselineCost - optimizeResult.totalFlightCost)
      : null;

  const handleOptimize = async () => {
    setOptimizeState("loading");
    try {
      const res = await fetch(`/api/v1/trips/${id}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeAirport, route, dateStart, dateEnd, travelers }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { skeleton } = await res.json() as { skeleton: FlightSkeleton };
      if (!skeleton || skeleton.totalFlightCost === 0) throw new Error("No prices returned");
      setOptimizeResult(skeleton);
      setOptimizeState("result");
      posthog?.capture("flight_optimization_completed", {
        trip_id: id,
        total_cost: skeleton.totalFlightCost,
        savings: skeleton.baselineCost ? Math.round(skeleton.baselineCost - skeleton.totalFlightCost) : 0,
      });
    } catch (e) {
      console.error("[optimize]", e);
      setOptimizeState("idle");
    }
  };

  const handleApplyOptimization = () => {
    if (!optimizeResult) return;
    setItinerary({
      ...itinerary,
      flightLegs: optimizeResult.legs as ItineraryFlightLeg[],
      ...(optimizeResult.baselineCost ? { flightBaselineCost: optimizeResult.baselineCost } : {}),
    });
    setOptimizeState("applied");
    posthog?.capture("flight_optimization_applied", { trip_id: id });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={isAuthenticated ?? false} />

      {/* Fixed top bar — sits below navbar (top-16) */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{tripTitle}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {totalDays} days · {countries.length} {countries.length === 1 ? "country" : "countries"} · Est. €{budget.total.toLocaleString()}
            </span>
            <Link
              href={`/trip/${id}/edit`}
              className="btn-ghost text-sm py-1.5 px-3 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </Link>
            <Link
              href={`/trip/${id}/summary`}
              className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
            >
              <LayoutList className="w-3.5 h-3.5" /> Summary
            </Link>
          </div>
        </div>
      </div>

      {/* Save-trip nudge for unauthenticated guests */}
      {isAuthenticated === false && (
        <div className="fixed top-[7.5rem] left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-accent/40">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-foreground">
              💾 Want to keep this itinerary? Create a free account to save it and access it from any device.
            </p>
            <Link
              href={`/signup?next=/trip/${id}`}
              className="shrink-0 btn-primary text-xs py-1.5 px-4"
            >
              Save trip →
            </Link>
          </div>
        </div>
      )}

      {/* Split layout: offset = navbar (64px) + top bar (~56px) = ~120px = 7.5rem
          When save banner is visible, add extra ~44px (2.75rem) offset          */}
      <div className={`${isAuthenticated === false ? "pt-[10.25rem]" : "pt-[7.5rem]"} flex flex-col lg:flex-row min-h-[calc(100vh-7.5rem)]`}>

        {/* Left panel — 40%, sticky */}
        <div className={`lg:w-[40%] bg-secondary p-6 lg:sticky ${isAuthenticated === false ? "lg:top-[10.25rem] lg:h-[calc(100vh-10.25rem)]" : "lg:top-[7.5rem] lg:h-[calc(100vh-7.5rem)]"} overflow-auto`}>
          <RouteMap
            cities={route}
            activeCityIndex={activeCityIndex}
            onCityClick={handleCityClick}
          />

          {/* Collapsible sidebar */}
          <div className="mt-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-3"
            >
              Trip Details
              {sidebarOpen
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />
              }
            </button>

            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Tab buttons */}
                <div className="flex gap-1 mb-4">
                  {(["visa", "weather", "budget"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 text-xs py-1.5 px-2 rounded-full font-medium transition-colors capitalize
                        ${activeTab === tab
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Visa tab */}
                {activeTab === "visa" && (
                  <div className="space-y-2">
                    {visaData.map((visa) => (
                      <div
                        key={visa.countryCode}
                        className="flex items-center gap-3 p-3 bg-background rounded-lg"
                      >
                        <span className="text-lg">{visa.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-foreground">{visa.country}</div>
                          <div className="text-xs text-muted-foreground">{visa.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Weather tab */}
                {activeTab === "weather" && (
                  <div className="space-y-2">
                    {weatherData.map((w) => (
                      <div
                        key={w.city}
                        className="flex items-center justify-between p-3 bg-background rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{w.icon}</span>
                          <span className="text-sm font-medium text-foreground">{w.city}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">{w.temp}</div>
                          <div className="text-xs text-muted-foreground">{w.condition}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Budget tab */}
                {activeTab === "budget" && (
                  <div className="space-y-3">
                    <BudgetBreakdown budget={budget} showProgressBars />
                    <div className="pt-3 border-t border-border flex justify-between">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-bold text-foreground">
                        €{budget.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-primary font-medium">
                      {getBudgetStatus(budget)}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* ── Optimize Flights card ─────────────────────────── */}
          <div className="mt-4">
            {optimizeState === "idle" && (
              <button
                onClick={handleOptimize}
                className="w-full p-4 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✈️</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      Optimize flight costs
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Find the cheapest date combination across all legs
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </button>
            )}

            {optimizeState === "loading" && (
              <div className="p-4 border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="text-xl animate-pulse">✈️</div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">Searching prices…</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Checking all date combinations — this takes ~30s
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
                </div>
              </div>
            )}

            {optimizeState === "result" && optimizeResult && (
              <div className="border-2 border-primary rounded-xl bg-primary/5 overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-foreground">Better dates found!</div>
                      {optimizeSaved && optimizeSaved > 0 && (
                        <div className="text-xs font-medium text-green-700 dark:text-green-400 mt-0.5">
                          ~€{optimizeSaved.toLocaleString()} cheaper than average date combination
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                      €{Math.round(optimizeResult.totalFlightCost).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {optimizeResult.legs.map((leg, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {leg.fromCity} → {leg.toCity}
                          <span className="ml-1 text-muted-foreground/60">{leg.departureDate}</span>
                        </span>
                        <span className="font-medium text-foreground">€{Math.round(leg.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleApplyOptimization}
                      className="btn-primary text-xs py-1.5 px-3 flex-1"
                    >
                      Apply these dates
                    </button>
                    <button
                      onClick={() => setOptimizeState("idle")}
                      className="btn-ghost text-xs py-1.5 px-3"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(optimizeState === "applied" || (optimizeState === "idle" && flightLegs)) && (
              <div className="p-3 border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Flights optimized ✓</span>
                  <span className="text-xs text-primary">
                    €{(optimizeResult?.totalFlightCost ?? flightLegs?.reduce((s, l) => s + l.price, 0) ?? 0).toLocaleString()}
                  </span>
                </div>
                {(optimizeResult?.legs ?? flightLegs)?.map((leg, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{leg.fromCity} → {leg.toCity}</span>
                    <span className="font-medium text-foreground">€{Math.round(leg.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel — 60% */}
        <div className="lg:w-[60%] p-6 lg:p-8">
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {days.map((day, i) => {
                const cityIndex = route.findIndex((c) => c.city === day.city);
                const isActive = activeCityIndex !== null && activeCityIndex === cityIndex;

                return (
                  <motion.div
                    key={day.day}
                    ref={(el) => { dayRefs.current[i] = el; }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="relative pl-12"
                  >
                    {/* City-colored dot on timeline line */}
                    <div
                      className={`absolute left-2.5 top-3 w-3 h-3 rounded-full ring-2 ring-background ${getCityColor(day.city, route)}`}
                    />

                    {/* Travel day banner */}
                    {day.isTravel && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground bg-secondary rounded-lg px-3 py-2">
                        <Plane className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>
                          {day.travelFrom} → {day.travelTo} · {day.travelDuration}
                        </span>
                      </div>
                    )}

                    {/* Day card — ring when city is active */}
                    <div
                      className={`card-travel bg-background cursor-pointer transition-all duration-200 hover:shadow-[var(--shadow-card-hover)]
                        ${isActive ? "ring-2 ring-primary" : ""}`}
                      onClick={() =>
                        setActiveCityIndex(cityIndex >= 0 ? cityIndex : null)
                      }
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">
                          Day {day.day} — {day.date} · {day.city}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {day.activities.map((activity, j) => (
                          <div key={j} className="flex gap-3">
                            <span className="text-lg mt-0.5 flex-shrink-0">{activity.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm text-foreground">
                                  {activity.name}
                                </span>
                                <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {activity.duration}
                                </span>
                                {activity.cost && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    {activity.cost}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {activity.why}
                              </p>
                              {activity.tip && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  💡 {activity.tip}
                                </p>
                              )}
                              {activity.food && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  🍽️ {activity.food}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
