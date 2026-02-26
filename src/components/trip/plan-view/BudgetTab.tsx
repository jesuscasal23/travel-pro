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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {hasFlights && (
          <div className="card-travel bg-background p-4">
            <div className="mb-1 flex items-center gap-2">
              <Plane className="text-primary h-4 w-4" />
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Flights
              </span>
            </div>
            <p className="text-foreground text-xl font-bold">{formatEur(flightTotal)}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">Optimized</p>
          </div>
        )}

        {hasActivityCosts && (
          <div className="card-travel bg-background p-4">
            <div className="mb-1 flex items-center gap-2">
              <Zap className="text-primary h-4 w-4" />
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Activities
              </span>
            </div>
            <p className="text-foreground text-xl font-bold">{formatEur(totalActivityCost)}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">Across all cities</p>
          </div>
        )}

        {(hasFlights || hasActivityCosts) && (
          <div className="card-travel bg-primary/5 border-primary/20 col-span-2 p-4 sm:col-span-1">
            <div className="mb-1 flex items-center gap-2">
              <DollarSign className="text-primary h-4 w-4" />
              <span className="text-primary text-xs font-medium tracking-wide uppercase">
                Tracked Total
              </span>
            </div>
            <p className="text-foreground text-xl font-bold">{formatEur(grandTotal)}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">Excludes accommodation</p>
          </div>
        )}
      </div>

      {/* No cost data state */}
      {!hasActivityCosts && !hasFlights && (
        <div className="text-muted-foreground py-8 text-center">
          <DollarSign className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">No cost data in this itinerary yet.</p>
          <p className="mt-1 text-xs">
            Activity costs appear here once your itinerary is generated.
          </p>
        </div>
      )}

      {/* Per-city breakdown */}
      {cityBudgets.filter((c) => c.activityTotal > 0).length > 0 && (
        <div>
          <h2 className="text-foreground mb-3 text-base font-semibold">Activity costs by city</h2>
          <div className="space-y-3">
            {cityBudgets
              .filter((c) => c.activityTotal > 0)
              .map((cb) => (
                <div key={cb.city} className="card-travel bg-background">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-foreground font-semibold">{cb.city}</h3>
                    <span className="text-primary text-sm font-bold">
                      {formatEur(cb.activityTotal)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {cb.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground mr-4 truncate">{item.name}</span>
                        <span className="text-foreground shrink-0 font-medium">
                          {formatEur(item.cost)}
                        </span>
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
        <h2 className="text-foreground mb-3 text-base font-semibold">Book & export</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="https://www.skyscanner.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:border-primary hover:bg-primary/5 group flex items-center gap-3 rounded-xl border p-4 transition-all"
          >
            <Plane className="text-muted-foreground group-hover:text-primary h-5 w-5 shrink-0 transition-colors" />
            <div>
              <p className="text-foreground text-sm font-medium">Search Flights</p>
              <p className="text-muted-foreground group-hover:text-primary text-xs transition-colors">
                Skyscanner →
              </p>
            </div>
          </a>
          <a
            href="https://www.booking.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:border-primary hover:bg-primary/5 group flex items-center gap-3 rounded-xl border p-4 transition-all"
          >
            <Hotel className="text-muted-foreground group-hover:text-primary h-5 w-5 shrink-0 transition-colors" />
            <div>
              <p className="text-foreground text-sm font-medium">Find Hotels</p>
              <p className="text-muted-foreground group-hover:text-primary text-xs transition-colors">
                Booking.com →
              </p>
            </div>
          </a>
        </div>

        {/* Link to full summary + PDF */}
        <Link
          href={`/trip/${tripId}/summary`}
          className="border-border hover:border-primary hover:bg-primary/5 group mt-3 flex items-center justify-between rounded-xl border p-4 transition-all"
        >
          <div className="flex items-center gap-3">
            <LayoutList className="text-muted-foreground group-hover:text-primary h-5 w-5 shrink-0 transition-colors" />
            <div>
              <p className="text-foreground text-sm font-medium">Full summary & PDF export</p>
              <p className="text-muted-foreground group-hover:text-primary text-xs transition-colors">
                Day-by-day plan, visas, flights →
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
