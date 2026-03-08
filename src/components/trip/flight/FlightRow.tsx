"use client";

import { memo } from "react";
import { ExternalLink } from "lucide-react";
import { buildTrackedLink } from "@/lib/affiliate/link-generator";
import type { FlightSearchResult } from "@/lib/flights/types";

/** Format ISO time -> "08:30" */
function formatTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

function StopsLabel({ stops }: { stops: number }) {
  if (stops === 0) return <span className="text-green-600 dark:text-green-400">Nonstop</span>;
  return (
    <span className="text-amber-600 dark:text-amber-400">
      {stops} stop{stops > 1 ? "s" : ""}
    </span>
  );
}

export const FlightRow = memo(function FlightRow({
  result,
  itineraryId,
}: {
  result: FlightSearchResult;
  itineraryId?: string;
}) {
  const trackedUrl = buildTrackedLink({
    provider: "skyscanner",
    type: "flight",
    itineraryId,
    dest: result.bookingUrl,
  });

  return (
    <a
      href={trackedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="border-border hover:border-primary hover:bg-primary/5 group flex items-center justify-between rounded-lg border p-3 transition-all duration-200"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-base">✈️</span>
        <div className="min-w-0">
          <div className="text-foreground flex items-center gap-2 text-sm font-medium">
            <span>{result.airline}</span>
            <span className="text-muted-foreground">·</span>
            <StopsLabel stops={result.stops} />
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{result.duration}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {formatTime(result.departureTime)}
            {result.arrivalTime && ` → ${formatTime(result.arrivalTime)}`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-right">
        <div>
          <div className="text-foreground text-sm font-bold">
            €{Math.round(result.price).toLocaleString()}
          </div>
          <div className="text-muted-foreground group-hover:text-primary text-xs transition-colors">
            Book <ExternalLink className="mb-0.5 inline h-3 w-3" />
          </div>
        </div>
      </div>
    </a>
  );
});
