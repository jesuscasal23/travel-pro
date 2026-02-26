"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { CityCard } from "../CityCard";
import { BoardingPassCard } from "../BoardingPassCard";
import { CityHeader } from "../CityHeader";
import { DayPills } from "../DayPills";
import { ActivityCard } from "../ActivityCard";
import { distributeActivities } from "@/lib/utils/time-distribution";
import { groupDaysByCity } from "@/lib/utils/group-days-by-city";
import { cityHasActivities } from "@/lib/utils/city-activities";
import type { Itinerary, CityWeather } from "@/types";

interface MobileJourneyTabProps {
  itinerary: Itinerary;
  generatingCityId?: string | null;
  onGenerateActivities?: (cityId: string, cityName: string) => void;
}

export function MobileJourneyTab({
  itinerary,
  generatingCityId,
  onGenerateActivities,
}: MobileJourneyTabProps) {
  const { route, days, flightLegs, weatherData } = itinerary;
  const [activeCityIdx, setActiveCityIdx] = useState(0);
  const cityScrollRef = useRef<HTMLDivElement>(null);

  const cityGroups = useMemo(() => groupDaysByCity(days, route), [days, route]);

  // Track active day per city group
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

  // Keyboard navigation for city card scroll
  const handleCityKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next = activeCityIdx;
      if (e.key === "ArrowRight") next = Math.min(activeCityIdx + 1, route.length - 1);
      else if (e.key === "ArrowLeft") next = Math.max(activeCityIdx - 1, 0);
      else return;

      e.preventDefault();
      setActiveCityIdx(next);
      const buttons = cityScrollRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]");
      buttons?.[next]?.focus();
    },
    [activeCityIdx, route.length]
  );

  return (
    <div className="pb-20">
      {/* City horizontal scroll */}
      <div className="mb-4 px-4">
        <div
          ref={cityScrollRef}
          role="tablist"
          aria-label="City selector"
          onKeyDown={handleCityKeyDown}
          className="scrollbar-hide flex gap-3 overflow-x-auto py-2"
        >
          {route.map((city, i) => (
            <CityCard
              key={city.id}
              city={city}
              isActive={activeCityIdx === i}
              onClick={() => setActiveCityIdx(i)}
              variant="mobile"
            />
          ))}
        </div>
      </div>

      {/* Boarding passes */}
      {flightLegs && flightLegs.length > 0 && (
        <div className="mb-6 px-4">
          <h3 className="text-foreground mb-2 text-sm font-semibold">🎫 Boarding passes</h3>
          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
            {flightLegs.map((leg, i) => (
              <BoardingPassCard key={i} leg={leg} variant="mobile" />
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
        const timedActivities = activeDay && hasActivities ? distributeActivities(activeDay) : [];

        return (
          <div key={group.cityId + groupIdx} className="mb-6 px-4">
            <CityHeader city={cityStop} weather={weather} variant="mobile" />

            {hasActivities ? (
              <>
                <DayPills
                  days={group.days}
                  activeDay={activeDayNum}
                  onDayClick={(dayNum) =>
                    setActiveDayMap((prev) => ({ ...prev, [groupIdx]: dayNum }))
                  }
                />

                {/* Stacked activity cards */}
                {activeDay && (
                  <div>
                    {/* Travel banner */}
                    {activeDay.isTravel && activeDay.travelFrom && activeDay.travelTo && (
                      <div className="text-muted-foreground bg-secondary mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
                        <span className="text-primary">✈️</span>
                        <span>
                          {activeDay.travelFrom} → {activeDay.travelTo}
                          {activeDay.travelDuration && <> · {activeDay.travelDuration}</>}
                        </span>
                      </div>
                    )}

                    {timedActivities.map((ta, i) => (
                      <ActivityCard
                        key={i}
                        timedActivity={ta}
                        isFirst={i === 0}
                        isLast={i === timedActivities.length - 1}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : isGeneratingThis ? (
              <div className="mt-3 space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <div className="border-primary h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" />
                  <span>Generating activities for {cityStop.city}...</span>
                </div>
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="bg-secondary h-14 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <button
                  onClick={() => onGenerateActivities?.(cityStop.id, cityStop.city)}
                  className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
                >
                  <span>✨</span>
                  Get activity recommendations
                </button>
                <p className="text-muted-foreground mt-1.5 text-center text-xs">
                  {cityStop.days} days · Tap for personalized suggestions
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
