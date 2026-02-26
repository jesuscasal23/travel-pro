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
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="text-center">
          <p className={`font-mono font-extrabold ${isMobile ? "text-lg" : "text-xl"}`}>
            {leg.fromIata}
          </p>
          <p className="text-muted-foreground text-[10px]">{leg.fromCity}</p>
        </div>

        <div className="flex flex-col items-center gap-0.5 px-2">
          <p className="text-muted-foreground text-[10px]">{leg.duration}</p>
          <div className="flex items-center gap-1">
            <div className="bg-border h-px w-6" />
            <Plane className="text-primary h-3 w-3" />
            <div className="bg-border h-px w-6" />
          </div>
          <p className="text-primary text-[10px] font-medium">{leg.airline}</p>
        </div>

        <div className="text-center">
          <p className={`font-mono font-extrabold ${isMobile ? "text-lg" : "text-xl"}`}>
            {leg.toIata}
          </p>
          <p className="text-muted-foreground text-[10px]">{leg.toCity}</p>
        </div>
      </div>

      {/* Dashed separator */}
      <div className="border-border mx-4 border-t border-dashed" />

      {/* Bottom section: date + price */}
      <div className="flex items-center justify-between px-4 pt-2 pb-3">
        <p className="text-muted-foreground text-xs">{formatDate(leg.departureDate)}</p>
        <p className={`text-primary font-bold ${isMobile ? "text-sm" : "text-base"}`}>
          &euro;{leg.price}
        </p>
      </div>
    </div>
  );
}
