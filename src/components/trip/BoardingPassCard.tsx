"use client";

import { Plane } from "lucide-react";
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

export function BoardingPassCard({ leg, variant }: BoardingPassCardProps) {
  const isMobile = variant === "mobile";

  return (
    <div
      className={`relative flex-shrink-0 rounded-xl ${
        isMobile ? "min-w-[220px]" : "min-w-[260px]"
      }`}
      style={{
        background: "var(--color-card)",
        /* Radial-gradient mask: two semicircle cutouts at 50% height */
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
      {/* Top section: IATA codes */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="text-center">
          <p className={`font-mono font-extrabold ${isMobile ? "text-lg" : "text-xl"}`}>
            {leg.fromIata}
          </p>
          <p className="text-[10px] text-muted-foreground">{leg.fromCity}</p>
        </div>

        <div className="flex flex-col items-center gap-0.5 px-2">
          <p className="text-[10px] text-muted-foreground">{leg.duration}</p>
          <div className="flex items-center gap-1">
            <div className="w-6 h-px bg-border" />
            <Plane className="w-3 h-3 text-primary" />
            <div className="w-6 h-px bg-border" />
          </div>
          <p className="text-[10px] text-primary font-medium">{leg.airline}</p>
        </div>

        <div className="text-center">
          <p className={`font-mono font-extrabold ${isMobile ? "text-lg" : "text-xl"}`}>
            {leg.toIata}
          </p>
          <p className="text-[10px] text-muted-foreground">{leg.toCity}</p>
        </div>
      </div>

      {/* Dashed separator */}
      <div className="mx-4 border-t border-dashed border-border" />

      {/* Bottom section: date + price */}
      <div className="px-4 pt-2 pb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{formatDate(leg.departureDate)}</p>
        <p className={`font-bold text-primary ${isMobile ? "text-sm" : "text-base"}`}>
          &euro;{leg.price}
        </p>
      </div>
    </div>
  );
}
