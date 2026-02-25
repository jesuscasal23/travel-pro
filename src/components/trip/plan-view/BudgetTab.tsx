"use client";

import Link from "next/link";
import { LayoutList, Plane, Hotel, Zap, DollarSign } from "lucide-react";
import type { Itinerary } from "@/types";

interface BudgetTabProps {
  itinerary: Itinerary;
  tripId: string;
}

/** Parse a cost string like "€45", "€12-15", "$30", "~€100" → numeric EUR value or null */
function parseCost(raw: string): number | null {
  // Strip currency symbols, tildes, "approx", etc. Take the first number found.
  const match = raw.replace(/[~≈approx\s]/gi, "").match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

interface CityBudget {
  city: string;
  activityTotal: number;
  activityCount: number;
  items: { name: string; cost: number }[];
}

function deriveCityBudgets(itinerary: Itinerary): CityBudget[] {
  const cityMap: Map<string, CityBudget> = new Map();

  for (const day of itinerary.days) {
    if (!cityMap.has(day.city)) {
      cityMap.set(day.city, { city: day.city, activityTotal: 0, activityCount: 0, items: [] });
    }
    const entry = cityMap.get(day.city)!;
    for (const activity of day.activities) {
      if (activity.cost) {
        const amount = parseCost(activity.cost);
        if (amount !== null && amount > 0) {
          entry.activityTotal += amount;
          entry.activityCount += 1;
          entry.items.push({ name: activity.name, cost: amount });
        }
      }
    }
  }

  return [...cityMap.values()];
}

function formatEur(amount: number) {
  return `€${Math.round(amount).toLocaleString()}`;
}

export function BudgetTab({ itinerary, tripId }: BudgetTabProps) {
  const cityBudgets = deriveCityBudgets(itinerary);
  const totalActivityCost = cityBudgets.reduce((sum, c) => sum + c.activityTotal, 0);
  const hasActivityCosts = totalActivityCost > 0;

  // Flight total from optimized legs
  const flightTotal = itinerary.flightLegs?.reduce((s, l) => s + l.price, 0) ?? 0;
  const hasFlights = flightTotal > 0;

  const grandTotal = totalActivityCost + flightTotal;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {hasFlights && (
          <div className="card-travel bg-background p-4">
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Flights</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatEur(flightTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Optimized</p>
          </div>
        )}

        {hasActivityCosts && (
          <div className="card-travel bg-background p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activities</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatEur(totalActivityCost)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Across all cities</p>
          </div>
        )}

        {(hasFlights || hasActivityCosts) && (
          <div className="card-travel bg-primary/5 border-primary/20 p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Tracked Total</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatEur(grandTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Excludes accommodation</p>
          </div>
        )}
      </div>

      {/* No cost data state */}
      {!hasActivityCosts && !hasFlights && (
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No cost data in this itinerary yet.</p>
          <p className="text-xs mt-1">Activity costs appear here once your itinerary is generated.</p>
        </div>
      )}

      {/* Per-city breakdown */}
      {cityBudgets.filter((c) => c.activityTotal > 0).length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Activity costs by city</h2>
          <div className="space-y-3">
            {cityBudgets
              .filter((c) => c.activityTotal > 0)
              .map((cb) => (
                <div key={cb.city} className="card-travel bg-background">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{cb.city}</h3>
                    <span className="text-sm font-bold text-primary">{formatEur(cb.activityTotal)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {cb.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-4">{item.name}</span>
                        <span className="text-foreground font-medium shrink-0">{formatEur(item.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Book & export section */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Book & export</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href="https://www.skyscanner.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <Plane className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Search Flights</p>
              <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Skyscanner →</p>
            </div>
          </a>
          <a
            href="https://www.booking.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <Hotel className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Find Hotels</p>
              <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Booking.com →</p>
            </div>
          </a>
        </div>

        {/* Link to full summary + PDF */}
        <Link
          href={`/trip/${tripId}/summary`}
          className="mt-3 flex items-center justify-between p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <LayoutList className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Full summary & PDF export</p>
              <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Day-by-day plan, visas, flights →</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
