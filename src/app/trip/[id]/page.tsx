"use client";

import { use, useState, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Edit3, Download, ChevronUp, ChevronDown, Clock, Plane } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import {
  sampleRoute,
  sampleItinerary,
  sampleBudget,
  sampleVisas,
  sampleWeather,
} from "@/data/sampleData";
import RouteMapFallback from "@/components/map/RouteMapFallback";

// Mapbox map loaded only on the client — mapbox-gl does not support SSR
const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => (
    <RouteMapFallback
      cities={sampleRoute}
      activeCityIndex={null}
      onCityClick={() => {}}
    />
  ),
});

// City → timeline dot color
const getCityColor = (city: string): string => {
  const map: Record<string, string> = {
    Tokyo: "bg-primary",
    Kyoto: "bg-primary",
    Hanoi: "bg-accent",
    "Ha Long Bay": "bg-accent",
    Bangkok: "bg-primary",
    "Chiang Mai": "bg-primary",
    Phuket: "bg-accent",
  };
  return map[city] ?? "bg-primary";
};

type Params = Promise<{ id: string }>;

export default function TripPage({ params }: { params: Params }) {
  const { id } = use(params);

  const [activeCityIndex, setActiveCityIndex] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"visa" | "weather" | "budget">("visa");
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Map pin click → set active city + scroll timeline to first day of that city
  const handleCityClick = useCallback((index: number) => {
    setActiveCityIndex(index);
    const city = sampleRoute[index]?.city;
    const dayIndex = sampleItinerary.findIndex((d) => d.city === city);
    if (dayIndex >= 0) {
      dayRefs.current[dayIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      {/* Fixed top bar — sits below navbar (top-16) */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Japan, Vietnam &amp; Thailand</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              22 days · 3 countries · Est. €8,400
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
              <Download className="w-3.5 h-3.5" /> Export
            </Link>
          </div>
        </div>
      </div>

      {/* Split layout: offset = navbar (64px) + top bar (~56px) = ~120px = 7.5rem */}
      <div className="pt-[7.5rem] flex flex-col lg:flex-row min-h-[calc(100vh-7.5rem)]">

        {/* Left panel — 40%, sticky */}
        <div className="lg:w-[40%] bg-secondary p-6 lg:sticky lg:top-[7.5rem] lg:h-[calc(100vh-7.5rem)] overflow-auto">
          <RouteMap
            cities={sampleRoute}
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
                    {sampleVisas.map((visa) => (
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
                    {sampleWeather.map((w) => (
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
                    {(Object.entries(sampleBudget) as [string, number][])
                      .filter(([k]) => k !== "total" && k !== "budget")
                      .map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize text-foreground">{key}</span>
                            <span className="font-medium text-foreground">
                              €{value.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(value / sampleBudget.budget) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    <div className="pt-3 border-t border-border flex justify-between">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-bold text-foreground">
                        €{sampleBudget.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-primary font-medium">
                      ✓ €{(sampleBudget.budget - sampleBudget.total).toLocaleString()} under budget
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right panel — 60% */}
        <div className="lg:w-[60%] p-6 lg:p-8">
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {sampleItinerary.map((day, i) => {
                const cityIndex = sampleRoute.findIndex((c) => c.city === day.city);
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
                      className={`absolute left-2.5 top-3 w-3 h-3 rounded-full ring-2 ring-background ${getCityColor(day.city)}`}
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
