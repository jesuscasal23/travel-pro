"use client";

import { useState } from "react";
import { PlanSidebar } from "./PlanSidebar";
import { ItineraryTab } from "./ItineraryTab";
import { EssentialsTab } from "./EssentialsTab";
import { BudgetTab } from "./BudgetTab";
import type { Itinerary } from "@/types";

type Tab = "itinerary" | "essentials" | "budget";

interface PlanViewLayoutProps {
  itinerary: Itinerary;
  homeAirport: string;
  isAuthenticated: boolean | null;
}

const TAB_LABELS: Record<Tab, string> = {
  itinerary: "Itinerary",
  essentials: "Essentials",
  budget: "Budget",
};

export function PlanViewLayout({ itinerary, homeAirport, isAuthenticated }: PlanViewLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const topOffset = isAuthenticated === false ? "lg:top-[10.25rem] lg:h-[calc(100vh-10.25rem)]" : "lg:top-[7.5rem] lg:h-[calc(100vh-7.5rem)]";

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Left sidebar */}
      <div className={`lg:w-[28%] bg-secondary/50 p-5 lg:sticky ${topOffset} overflow-auto`}>
        <PlanSidebar itinerary={itinerary} homeAirport={homeAirport} />
      </div>

      {/* Main content */}
      <div className="lg:w-[72%] p-5 lg:p-8">
        {/* Tab bar */}
        <div className="flex gap-0 border-b border-border mb-6">
          {(["itinerary", "essentials", "budget"] as const).map((tab) => (
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
      </div>
    </div>
  );
}
