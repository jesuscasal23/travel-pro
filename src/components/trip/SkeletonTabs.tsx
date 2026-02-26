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
          <div className="mt-4 flex gap-2">
            {Array.from({ length: city.days }, (_, i) => (
              <div key={i} className="bg-secondary h-8 w-16 animate-pulse rounded-full" />
            ))}
          </div>

          {/* Activity card skeletons */}
          <div className="mt-3 space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="border-border flex animate-pulse items-start gap-3 rounded-xl border p-4"
              >
                <div className="bg-secondary h-10 w-10 flex-shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="bg-secondary h-4 w-40 rounded" />
                  <div className="bg-secondary h-3 w-64 rounded" />
                </div>
                <div className="bg-secondary h-5 w-14 flex-shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
