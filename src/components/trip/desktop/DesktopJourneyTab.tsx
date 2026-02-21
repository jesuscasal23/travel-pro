"use client";

import { useState, useMemo } from "react";
import { BoardingPassCard } from "../BoardingPassCard";
import { CityHeader } from "../CityHeader";
import { DayPills } from "../DayPills";
import { DesktopTimeline } from "./DesktopTimeline";
import { groupDaysByCity } from "@/lib/utils/group-days-by-city";
import type { Itinerary, CityWeather } from "@/types";

interface DesktopJourneyTabProps {
  itinerary: Itinerary;
}

export function DesktopJourneyTab({ itinerary }: DesktopJourneyTabProps) {
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
        const activeDayNum = activeDayMap[groupIdx] ?? group.days[0]?.day;
        const activeDay = group.days.find((d) => d.day === activeDayNum) ?? group.days[0];

        return (
          <div key={group.cityId + groupIdx} className="mb-8">
            <CityHeader city={cityStop} weather={weather} variant="desktop" />

            <DayPills
              days={group.days}
              activeDay={activeDayNum}
              onDayClick={(dayNum) =>
                setActiveDayMap((prev) => ({ ...prev, [groupIdx]: dayNum }))
              }
            />

            {/* Travel banner */}
            {activeDay?.isTravel && activeDay.travelFrom && activeDay.travelTo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary rounded-lg px-4 py-2.5 mt-2">
                <span className="text-primary">✈️</span>
                <span>
                  {activeDay.travelFrom} → {activeDay.travelTo}
                  {activeDay.travelDuration && <> · {activeDay.travelDuration}</>}
                </span>
              </div>
            )}

            {/* Desktop proportional timeline */}
            {activeDay && activeDay.activities.length > 0 && (
              <DesktopTimeline day={activeDay} />
            )}
          </div>
        );
      })}
    </div>
  );
}
