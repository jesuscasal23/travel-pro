"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { CityCard } from "../CityCard";
import { BoardingPassCard } from "../BoardingPassCard";
import { CityHeader } from "../CityHeader";
import { DayPills } from "../DayPills";
import { ActivityCard } from "../ActivityCard";
import { distributeActivities } from "@/lib/utils/time-distribution";
import { groupDaysByCity } from "@/lib/utils/group-days-by-city";
import type { Itinerary, CityWeather } from "@/types";

interface MobileJourneyTabProps {
  itinerary: Itinerary;
}

export function MobileJourneyTab({ itinerary }: MobileJourneyTabProps) {
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
    [activeCityIdx, route.length],
  );

  return (
    <div className="pb-20">
      {/* City horizontal scroll */}
      <div className="px-4 mb-4">
        <div
          ref={cityScrollRef}
          role="tablist"
          aria-label="City selector"
          onKeyDown={handleCityKeyDown}
          className="flex gap-3 overflow-x-auto scrollbar-hide py-2"
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
        <div className="px-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">🎫 Boarding passes</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
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
        const activeDayNum = activeDayMap[groupIdx] ?? group.days[0]?.day;
        const activeDay = group.days.find((d) => d.day === activeDayNum) ?? group.days[0];
        const timedActivities = activeDay ? distributeActivities(activeDay) : [];

        return (
          <div key={group.cityId + groupIdx} className="px-4 mb-6">
            <CityHeader city={cityStop} weather={weather} variant="mobile" />

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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2 mb-2">
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
          </div>
        );
      })}
    </div>
  );
}
