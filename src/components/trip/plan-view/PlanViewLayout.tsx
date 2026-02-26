"use client";

import { useState } from "react";
import { PlanSidebar } from "./PlanSidebar";
import { ItineraryTab } from "./ItineraryTab";
import { EssentialsTab } from "./EssentialsTab";
import type { Itinerary } from "@/types";

type Tab = "itinerary" | "essentials";

interface PlanViewLayoutProps {
  itinerary: Itinerary;
  homeAirport: string;
  isAuthenticated: boolean | null;
}

const TAB_LABELS: Record<Tab, string> = {
  itinerary: "Itinerary",
  essentials: "Essentials",
};

export function PlanViewLayout({ itinerary, homeAirport, isAuthenticated }: PlanViewLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const topOffset =
    isAuthenticated === false
      ? "lg:top-[10.25rem] lg:h-[calc(100vh-10.25rem)]"
      : "lg:top-[7.5rem] lg:h-[calc(100vh-7.5rem)]";

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Left sidebar */}
      <div className={`bg-secondary/50 p-5 lg:sticky lg:w-[28%] ${topOffset} overflow-auto`}>
        <PlanSidebar itinerary={itinerary} homeAirport={homeAirport} />
      </div>

      {/* Main content */}
      <div className="p-5 lg:w-[72%] lg:p-8">
        {/* Tab bar */}
        <div className="border-border mb-6 flex gap-0 border-b">
          {(["itinerary", "essentials"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABELS[tab]}
              {activeTab === tab && (
                <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "itinerary" && (
          <ItineraryTab days={itinerary.days} route={itinerary.route} />
        )}
        {activeTab === "essentials" && <EssentialsTab itinerary={itinerary} />}
      </div>
    </div>
  );
}
