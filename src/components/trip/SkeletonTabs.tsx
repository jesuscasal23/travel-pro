"use client";

import { Loader2 } from "lucide-react";
import type { CityStop } from "@/types";

export function ItinerarySkeletonTab({ route, isGenerating }: { route: CityStop[]; isGenerating: boolean }) {
  const cityGroups = route.reduce<{ city: string; startDay: number; endDay: number; days: number }[]>((acc, city) => {
    const startDay = acc.length > 0 ? acc[acc.length - 1].endDay + 1 : 1;
    acc.push({ city: city.city, startDay, endDay: startDay + city.days - 1, days: city.days });
    return acc;
  }, []);

  return (
    <div className="space-y-3">
      {isGenerating && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-xl mb-4">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-sm text-primary font-medium">Generating your daily itinerary...</span>
        </div>
      )}
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

export function BudgetSkeletonTab({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div className="space-y-8">
      {isGenerating && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-xl">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-sm text-primary font-medium">Calculating your budget...</span>
        </div>
      )}
      <div className="bg-background border border-border rounded-xl p-6 text-center animate-pulse">
        <div className="w-24 h-4 bg-secondary rounded mx-auto" />
        <div className="w-40 h-12 bg-secondary rounded mx-auto mt-3" />
        <div className="w-48 h-4 bg-secondary rounded mx-auto mt-3" />
      </div>
      <div className="animate-pulse">
        <div className="w-40 h-5 bg-secondary rounded mb-3" />
        <div className="h-4 bg-secondary rounded-full" />
        <div className="flex gap-4 mt-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-secondary rounded-full" />
              <div className="w-16 h-3 bg-secondary rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
