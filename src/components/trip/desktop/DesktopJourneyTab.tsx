"use client";

import { useState, useMemo } from "react";
import { BoardingPassCard } from "../BoardingPassCard";
import { CityHeader } from "../CityHeader";
import { DayPills } from "../DayPills";
import { ActivityCard } from "../ActivityCard";
import { distributeActivities } from "@/lib/utils/time-distribution";
import { groupDaysByCity } from "@/lib/utils/group-days-by-city";
import { cityHasActivities } from "@/lib/utils/city-activities";
import type { Itinerary, CityWeather } from "@/types";

interface DesktopJourneyTabProps {
  itinerary: Itinerary;
  generatingCityId?: string | null;
  onGenerateActivities?: (cityId: string, cityName: string) => void;
}

export function DesktopJourneyTab({ itinerary, generatingCityId, onGenerateActivities }: DesktopJourneyTabProps) {
  const { route, days, flightLegs, weatherData } = itinerary;

  const cityGroups = useMemo(() => groupDaysByCity(days, route), [days, route]);

  const [activeDayMap, setActiveDayMap] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    cityGroups.forEach((group, i) => {
      if (group.days.length > 0) map[i] = group.days[0].day;
    });
    return map;
  });

  // Memoize weather lookup as a Map for O(1) access
  const weatherMap = useMemo(() => {
    const m = new Map<string, CityWeather>();
    weatherData?.forEach((w) => m.set(w.city, w));
    return m;
  }, [weatherData]);

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6">
      {/* Boarding passes */}
      {flightLegs && flightLegs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-base font-semibold text-foreground mb-3">🎫 Your boarding passes</h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {flightLegs.map((leg, i) => (
              <BoardingPassCard key={i} leg={leg} variant="desktop" />
            ))}
          </div>
        </div>
      )}

      {/* City sections */}
      {cityGroups.map((group, groupIdx) => {
        const cityStop = route.find((r) => r.city === group.city) ?? route[0];
        const weather = weatherMap.get(group.city);
        const hasActivities = cityHasActivities(itinerary, cityStop.id);
        const isGeneratingThis = generatingCityId === cityStop.id;
        const activeDayNum = activeDayMap[groupIdx] ?? group.days[0]?.day;
        const activeDay = group.days.find((d) => d.day === activeDayNum) ?? group.days[0];

        return (
          <div key={group.cityId + groupIdx} className="mb-8">
            <CityHeader city={cityStop} weather={weather} variant="desktop" />

            {hasActivities ? (
              <>
                <DayPills
                  days={group.days}
                  activeDay={activeDayNum}
                  onDayClick={(dayNum) =>
                    setActiveDayMap((prev) => ({ ...prev, [groupIdx]: dayNum }))
                  }
                />

                {activeDay && (
                  <div>
                    {/* Travel banner */}
                    {activeDay.isTravel && activeDay.travelFrom && activeDay.travelTo && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary rounded-lg px-4 py-2.5 mt-2 mb-2">
                        <span className="text-primary">✈️</span>
                        <span>
                          {activeDay.travelFrom} → {activeDay.travelTo}
                          {activeDay.travelDuration && <> · {activeDay.travelDuration}</>}
                        </span>
                      </div>
                    )}

                    {/* Stacked activity cards */}
                    {distributeActivities(activeDay).map((ta, i, arr) => (
                      <ActivityCard
                        key={i}
                        timedActivity={ta}
                        isFirst={i === 0}
                        isLast={i === arr.length - 1}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : isGeneratingThis ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Generating activity recommendations for {cityStop.city}...</span>
                </div>
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <button
                  onClick={() => onGenerateActivities?.(cityStop.id, cityStop.city)}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <span>✨</span>
                  Get activity recommendations for {cityStop.city}
                </button>
                <p className="text-xs text-muted-foreground mt-2">
                  {cityStop.days} days · Click to get personalized activity suggestions
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
