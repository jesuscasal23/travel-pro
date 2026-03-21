"use client";

import { Plane } from "lucide-react";
import { getAirlineName } from "@/lib/flights/airlines";
import type { ItineraryFlightLeg } from "@/types";

interface BoardingPassCardProps {
  leg: ItineraryFlightLeg;
  variant: "mobile" | "desktop";
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

/** Format time strings like "2025-06-01T08:30:00" or "08:30" → "08:30" */
function formatTime(time: string): string {
  if (!time) return "";
  try {
    // If it's an ISO string or parseable date
    if (time.includes("T") || time.length > 8) {
      return new Date(time).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    // Already "HH:MM" or similar
    return time.slice(0, 5);
  } catch {
    return time.slice(0, 5);
  }
}

function StopsLabel({ stops }: { stops: number }) {
  if (stops === 0)
    return <span className="text-[10px] text-green-600 dark:text-green-400">Direct</span>;
  return (
    <span className="text-[10px] text-amber-600 dark:text-amber-400">
      {stops} stop{stops > 1 ? "s" : ""}
    </span>
  );
}

export function BoardingPassCard({ leg, variant }: BoardingPassCardProps) {
  const isMobile = variant === "mobile";
  const airlineName = getAirlineName(leg.airline);
  const hasTimes = !!(leg.departureTime || leg.arrivalTime);

  return (
    <div
      className={`relative flex-shrink-0 rounded-xl ${
        isMobile ? "min-w-[240px]" : "min-w-[280px]"
      }`}
      style={{
        background: "var(--color-card)",
        mask: `
          radial-gradient(circle 8px at 0%  50%, transparent 99%, black 100%),
          radial-gradient(circle 8px at 100% 50%, transparent 99%, black 100%)
        `,
        WebkitMask: `
          radial-gradient(circle 8px at 0%  50%, transparent 99%, black 100%),
          radial-gradient(circle 8px at 100% 50%, transparent 99%, black 100%)
        `,
        maskComposite: "intersect",
        WebkitMaskComposite: "destination-in",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* Top section: route + times */}
      <div className="px-4 pt-3 pb-2">
        {/* IATA codes with flight line */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className={`font-mono font-extrabold ${isMobile ? "text-lg" : "text-xl"}`}>
              {leg.fromIata}
            </p>
            {hasTimes && leg.departureTime && (
              <p className="text-foreground text-xs font-semibold tabular-nums">
                {formatTime(leg.departureTime)}
              </p>
            )}
            <p className="text-muted-foreground text-[10px] leading-tight">{leg.fromCity}</p>
          </div>

          <div className="flex flex-col items-center gap-0.5 px-2">
            <p className="text-muted-foreground text-[10px]">{leg.duration}</p>
            <div className="flex items-center gap-1">
              <div className="bg-border h-px w-6" />
              <Plane className="text-primary h-3 w-3" />
              <div className="bg-border h-px w-6" />
            </div>
            {leg.stops != null && <StopsLabel stops={leg.stops} />}
          </div>

          <div className="text-center">
            <p className={`font-mono font-extrabold ${isMobile ? "text-lg" : "text-xl"}`}>
              {leg.toIata}
            </p>
            {hasTimes && leg.arrivalTime && (
              <p className="text-foreground text-xs font-semibold tabular-nums">
                {formatTime(leg.arrivalTime)}
              </p>
            )}
            <p className="text-muted-foreground text-[10px] leading-tight">{leg.toCity}</p>
          </div>
        </div>
      </div>

      {/* Dashed separator */}
      <div className="border-border mx-4 border-t border-dashed" />

      {/* Bottom section: airline + date + price */}
      <div className="flex items-center justify-between px-4 pt-2 pb-3">
        <div className="min-w-0">
          <p className="text-primary truncate text-xs font-medium">{airlineName}</p>
          <p className="text-muted-foreground text-[10px]">{formatDate(leg.departureDate)}</p>
        </div>
        <p className={`text-primary font-bold ${isMobile ? "text-sm" : "text-base"}`}>
          &euro;{Math.round(leg.price).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
