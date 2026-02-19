"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Edit3, LayoutList } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { Navbar } from "@/components/Navbar";
import { useItinerary } from "@/hooks/useItinerary";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { TripNotFound } from "@/components/trip/TripNotFound";
import { ItineraryTab } from "@/components/trip/plan-view/ItineraryTab";
import { EssentialsTab } from "@/components/trip/plan-view/EssentialsTab";
import { BudgetTab } from "@/components/trip/plan-view/BudgetTab";

const RouteMap = dynamic(() => import("@/components/map/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-150 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground">
      Loading map…
    </div>
  ),
});

type Tab = "itinerary" | "essentials" | "budget" | "map";

const TAB_LABELS: Record<Tab, string> = {
  itinerary: "Itinerary",
  essentials: "Essentials",
  budget: "Budget",
  map: "Map",
};

type Params = Promise<{ id: string }>;

export default function TripPage({ params }: { params: Params }) {
  const { id } = use(params);
  const itinerary = useItinerary();
  const route = itinerary?.route ?? [];
  const days = itinerary?.days ?? [];

  const posthog = usePostHog();
  const isAuthenticated = useAuthStatus();
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const [activeCityIndex, setActiveCityIndex] = useState<number | null>(null);

  useEffect(() => {
    posthog?.capture("itinerary_viewed", { trip_id: id, city_count: route.length });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Early return for null itinerary — all hooks must be called above this line
  if (!itinerary) {
    return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
  }

  const { budget } = itinerary;
  const countries = [...new Set(route.map((r) => r.country))];
  const singleCity = route.length === 1;
  const tripTitle = singleCity ? `${route[0].city}, ${route[0].country}` : countries.join(", ");
  const totalDays = days.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={isAuthenticated ?? false} />

      {/* Fixed top bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{tripTitle}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {totalDays} days{!singleCity && ` · ${countries.length} ${countries.length === 1 ? "country" : "countries"}`} · Est. €{budget.total.toLocaleString()}
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

      {/* Main content */}
      <div className={`${isAuthenticated === false ? "pt-[10.25rem]" : "pt-[7.5rem]"} min-h-[calc(100vh-7.5rem)]`}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-border mb-6">
            {(["itinerary", "essentials", "budget", "map"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {TAB_LABELS[tab]}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "itinerary" && (
            <ItineraryTab days={itinerary.days} route={itinerary.route} />
          )}
          {activeTab === "essentials" && (
            <EssentialsTab itinerary={itinerary} />
          )}
          {activeTab === "budget" && (
            <BudgetTab budget={itinerary.budget} route={itinerary.route} days={itinerary.days} />
          )}
          {activeTab === "map" && (
            <div className="h-150 rounded-xl overflow-hidden border border-border">
              <RouteMap
                cities={itinerary.route}
                activeCityIndex={activeCityIndex}
                onCityClick={(index: number) => setActiveCityIndex(index)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
