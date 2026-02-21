"use client";

import type { CityStop } from "@/types";

export function ItinerarySkeletonTab({ route }: { route: CityStop[] }) {
  const cityGroups = route.reduce<{ city: string; startDay: number; endDay: number; days: number }[]>((acc, city) => {
    const startDay = acc.length > 0 ? acc[acc.length - 1].endDay + 1 : 1;
    acc.push({ city: city.city, startDay, endDay: startDay + city.days - 1, days: city.days });
    return acc;
  }, []);

  return (
    <div className="space-y-3">
      {cityGroups.map((group) =>
        Array.from({ length: group.days }, (_, i) => {
          const dayNum = group.startDay + i;
          return (
            <div
              key={dayNum}
              className="flex items-center gap-4 p-4 bg-background border border-border rounded-xl animate-pulse"
            >
              <span className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                {dayNum}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {route.length === 1 ? `Day ${dayNum}` : `Day ${dayNum} – ${group.city}`}
                  </span>
                </div>
                <div className="w-32 h-3 bg-secondary rounded mt-1.5" />
              </div>
              <div className="w-16 h-5 bg-secondary rounded-full flex-shrink-0" />
            </div>
          );
        })
      )}
    </div>
  );
}
