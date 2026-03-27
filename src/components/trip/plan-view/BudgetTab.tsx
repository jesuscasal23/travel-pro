"use client";

import Link from "next/link";
import { LayoutList, Plane, Hotel, Zap, DollarSign, Construction } from "lucide-react";

interface BudgetTabProps {
  tripId: string;
}

const exampleBreakdown = {
  flights: 420,
  hotels: 680,
  activities: 195,
};

const exampleCities = [
  {
    city: "Barcelona",
    items: [
      { name: "Sagrada Familia tickets", cost: 26 },
      { name: "Gothic Quarter food tour", cost: 65 },
      { name: "Park Guell entry", cost: 13 },
    ],
  },
  {
    city: "Lisbon",
    items: [
      { name: "Sintra day trip", cost: 45 },
      { name: "Tram 28 pass", cost: 7 },
      { name: "Pasteis de Belem tasting", cost: 12 },
    ],
  },
];

function formatEur(amount: number) {
  return `€${Math.round(amount).toLocaleString()}`;
}

export function BudgetTab({ tripId }: BudgetTabProps) {
  const grandTotal =
    exampleBreakdown.flights + exampleBreakdown.hotels + exampleBreakdown.activities;

  return (
    <div className="space-y-8">
      {/* In development banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <Construction className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Budget tracking is in development
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            The values below are examples only. Personalized budget estimates based on your trip
            details are coming soon.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card-travel bg-background p-4 opacity-70">
          <div className="mb-1 flex items-center gap-2">
            <Plane className="text-primary h-4 w-4" />
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Flights
            </span>
          </div>
          <p className="text-foreground text-xl font-bold">
            ~{formatEur(exampleBreakdown.flights)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">Example estimate</p>
        </div>

        <div className="card-travel bg-background p-4 opacity-70">
          <div className="mb-1 flex items-center gap-2">
            <Hotel className="text-primary h-4 w-4" />
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Hotels
            </span>
          </div>
          <p className="text-foreground text-xl font-bold">~{formatEur(exampleBreakdown.hotels)}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">Example estimate</p>
        </div>

        <div className="card-travel bg-background p-4 opacity-70">
          <div className="mb-1 flex items-center gap-2">
            <Zap className="text-primary h-4 w-4" />
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Activities
            </span>
          </div>
          <p className="text-foreground text-xl font-bold">
            ~{formatEur(exampleBreakdown.activities)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">Example estimate</p>
        </div>

        <div className="card-travel bg-primary/5 border-primary/20 col-span-2 p-4 opacity-70 sm:col-span-1">
          <div className="mb-1 flex items-center gap-2">
            <DollarSign className="text-primary h-4 w-4" />
            <span className="text-primary text-xs font-medium tracking-wide uppercase">
              Example Total
            </span>
          </div>
          <p className="text-foreground text-xl font-bold">~{formatEur(grandTotal)}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">Not based on your trip</p>
        </div>
      </div>

      {/* Example per-city breakdown */}
      <div>
        <h2 className="text-foreground mb-3 text-base font-semibold">
          Example activity costs by city
        </h2>
        <div className="space-y-3">
          {exampleCities.map((cb) => (
            <div key={cb.city} className="card-travel bg-background opacity-70">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-foreground font-semibold">{cb.city}</h3>
                <span className="text-primary text-sm font-bold">
                  ~{formatEur(cb.items.reduce((s, i) => s + i.cost, 0))}
                </span>
              </div>
              <div className="space-y-1.5">
                {cb.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground mr-4 truncate">{item.name}</span>
                    <span className="text-foreground shrink-0 font-medium">
                      ~{formatEur(item.cost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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
                Skyscanner &rarr;
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
                Booking.com &rarr;
              </p>
            </div>
          </a>
        </div>

        <Link
          href={`/trips/${tripId}`}
          className="border-border hover:border-primary hover:bg-primary/5 group mt-3 flex items-center justify-between rounded-xl border p-4 transition-all"
        >
          <div className="flex items-center gap-3">
            <LayoutList className="text-muted-foreground group-hover:text-primary h-5 w-5 shrink-0 transition-colors" />
            <div>
              <p className="text-foreground text-sm font-medium">Trip overview</p>
              <p className="text-muted-foreground group-hover:text-primary text-xs transition-colors">
                Itinerary, bookings, map &rarr;
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
