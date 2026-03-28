"use client";

import Link from "next/link";
import { LayoutList, Plane, Hotel, Zap, DollarSign, Info } from "lucide-react";
import { useTripContext } from "@/components/trip/TripContext";
import { useFlightSelections } from "@/hooks/api/selections/useFlightSelections";
import { useHotelSelections } from "@/hooks/api/selections/useHotelSelections";
import {
  computeBudgetSummary,
  deriveCityActivityBudgets,
  type BudgetSummary,
} from "@/lib/utils/budget";

function formatEur(amount: number) {
  return `€${Math.round(amount).toLocaleString()}`;
}

function SourceHint({ label }: { label: string }) {
  return <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>;
}

function NotEstimated() {
  return (
    <>
      <p className="text-muted-foreground text-lg font-semibold">—</p>
      <SourceHint label="Not estimated" />
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  hint: string | null;
  accent?: boolean;
}) {
  return (
    <div
      className={`card-travel p-4 ${accent ? "bg-primary/5 border-primary/20 col-span-2 sm:col-span-1" : "bg-background"}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-primary"}`} />
        <span
          className={`text-xs font-medium tracking-wide uppercase ${accent ? "text-primary" : "text-muted-foreground"}`}
        >
          {label}
        </span>
      </div>
      {value != null ? (
        <>
          <p className="text-foreground text-xl font-bold">{formatEur(value)}</p>
          {hint && <SourceHint label={hint} />}
        </>
      ) : (
        <NotEstimated />
      )}
    </div>
  );
}

export function BudgetTab({ tripId }: { tripId: string }) {
  const { itinerary, isAuthenticated } = useTripContext();
  const isAuthed = isAuthenticated === true;

  const { data: flightSelections } = useFlightSelections(tripId, { enabled: isAuthed });
  const { data: hotelSelections } = useHotelSelections(tripId, { enabled: isAuthed });

  const summary = computeBudgetSummary(itinerary, flightSelections, hotelSelections);

  const cityBudgets = itinerary?.days ? deriveCityActivityBudgets(itinerary.days) : [];

  const hasAnyData =
    summary.flights != null || summary.hotels != null || summary.activities != null;

  return (
    <div className="space-y-8">
      {/* Info banner when no data at all */}
      {!hasAnyData && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              No budget data yet
            </p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
              Budget estimates will appear as your trip takes shape — select flights, hotels, or
              discover activities to see costs here.
            </p>
          </div>
        </div>
      )}

      {/* Partial data hint */}
      {hasAnyData &&
        summary.grandTotal != null &&
        (summary.flights == null || summary.hotels == null) && (
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Some categories are not yet estimated. The total only includes available data.
            </p>
          </div>
        )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={Plane}
          label="Flights"
          value={summary.flights?.total ?? null}
          hint={flightHint(summary.flights)}
        />
        <SummaryCard
          icon={Hotel}
          label="Hotels"
          value={summary.hotels?.total ?? null}
          hint={hotelHint(summary.hotels)}
        />
        <SummaryCard
          icon={Zap}
          label="Activities"
          value={summary.activities?.total ?? null}
          hint={summary.activities ? "From itinerary" : null}
        />
        <SummaryCard
          icon={DollarSign}
          label="Total"
          value={summary.grandTotal}
          hint={summary.grandTotal != null ? "Available categories" : null}
          accent
        />
      </div>

      {/* Per-city activity breakdown */}
      {cityBudgets.length > 0 && (
        <div>
          <h2 className="text-foreground mb-3 text-base font-semibold">Activity costs by city</h2>
          <div className="space-y-3">
            {cityBudgets.map((cb) => (
              <div key={cb.city} className="card-travel bg-background">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-foreground font-semibold">{cb.city}</h3>
                  <span className="text-primary text-sm font-bold">{formatEur(cb.total)}</span>
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

function flightHint(flights: BudgetSummary["flights"]): string | null {
  if (!flights) return null;
  return flights.source === "selections" ? "Your selections" : "Best search results";
}

function hotelHint(hotels: BudgetSummary["hotels"]): string | null {
  if (!hotels) return null;
  return hotels.source === "selections" ? "Your selections" : "Cheapest available";
}
