"use client";

import { CityHeader } from "./CityHeader";
import type { CityStop } from "@/types";

export function ItinerarySkeletonTab({ route }: { route: CityStop[] }) {
  return (
    <div>
      {route.map((city) => (
        <div key={city.id} className="mb-8">
          {/* Real city header with image */}
          <CityHeader city={city} variant="desktop" />

          {/* Day pills skeleton */}
          <div className="flex gap-2 mt-4">
            {Array.from({ length: city.days }, (_, i) => (
              <div
                key={i}
                className="h-8 w-16 rounded-full bg-secondary animate-pulse"
              />
            ))}
          </div>

          {/* Activity card skeletons */}
          <div className="mt-3 space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl border border-border animate-pulse"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-secondary rounded" />
                  <div className="h-3 w-64 bg-secondary rounded" />
                </div>
                <div className="w-14 h-5 bg-secondary rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
