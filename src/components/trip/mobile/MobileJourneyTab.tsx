"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { CityCard } from "../CityCard";
import { BoardingPassCard } from "../BoardingPassCard";
import { CityHeader } from "../CityHeader";
import { DayPills } from "../DayPills";
import { ActivityCard } from "../ActivityCard";
import { distributeActivities } from "@/lib/utils/trip/time-distribution";
import { groupDaysByCity } from "@/lib/utils/trip/group-days-by-city";
import { cityHasActivities } from "@/lib/utils/trip/city-activities";
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
    [activeCityIdx, route.length]
  );

  return (
    <div className="pb-8">
      {/* City horizontal scroll */}
      {route.length > 1 && (
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
      )}

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
        const activeDayNum = activeDayMap[groupIdx] ?? group.days[0]?.day;
        const activeDay = group.days.find((d) => d.day === activeDayNum) ?? group.days[0];
        const timedActivities = activeDay && hasActivities ? distributeActivities(activeDay) : [];

        return (
          <div key={group.cityId + groupIdx} className="mb-6 px-4">
            {route.length > 1 ? (
              <CityHeader city={cityStop} weather={weather} variant="mobile" />
            ) : (
              <div className="shadow-glass-md mb-3 flex items-start justify-between gap-3 rounded-[22px] border border-white/80 bg-white/82 px-4 py-3">
                <div>
                  <h3 className="text-navy text-[1.05rem] font-semibold tracking-[-0.02em]">
                    {cityStop.city}
                  </h3>
                  <p className="text-dim mt-1 text-[13px]">
                    {cityStop.country} · {cityStop.days} days
                  </p>
                </div>
                {weather ? (
                  <div className="text-brand-primary bg-brand-primary-soft flex items-center gap-1 rounded-full px-2.5 py-1">
                    <span className="text-sm">{weather.icon}</span>
                    <span className="text-xs font-semibold">{weather.temp}</span>
                  </div>
                ) : null}
              </div>
            )}

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
                      <div className="text-dim shadow-glass-md mb-3 flex items-center gap-2 rounded-[20px] border border-white/80 bg-white/78 px-3 py-2.5 text-xs backdrop-blur-sm">
                        <span className="text-brand-primary">✈️</span>
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
            ) : (
              <div className="mt-3 space-y-2">
                <div className="text-dim flex items-center gap-2 text-xs">
                  <div className="border-brand-primary h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" />
                  <span>{`Preparing activity recommendations for ${cityStop.city}...`}</span>
                </div>
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className="shadow-glass-md h-14 animate-pulse rounded-[20px] border border-white/80 bg-white/72"
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
