"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Footprints, Bus, TrainFront, Plane } from "lucide-react";
import type { TripDay, CityStop } from "@/types";

interface ItineraryTabProps {
  days: TripDay[];
  route: CityStop[];
}

function getDayType(day: TripDay, index: number): { label: string; variant: "arrival" | "full" | "travel" } {
  if (index === 0) return { label: "Arrival", variant: "arrival" };
  if (day.isTravel) return { label: "Travel day", variant: "travel" };
  return { label: "Full day", variant: "full" };
}

const badgeStyles = {
  arrival: "bg-primary/10 text-primary border border-primary/20",
  full: "bg-primary/10 text-primary border border-primary/20",
  travel: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-700",
};

function getTransportIcon(activity: { name: string; category: string }) {
  const name = activity.name.toLowerCase();
  if (/walk|stroll/.test(name)) return <Footprints className="w-3 h-3" />;
  if (/bus/.test(name)) return <Bus className="w-3 h-3" />;
  if (/train|shinkansen|rail/.test(name)) return <TrainFront className="w-3 h-3" />;
  if (/flight|fly|airport/.test(name)) return <Plane className="w-3 h-3" />;
  return null;
}

export function ItineraryTab({ days, route }: ItineraryTabProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  const toggleDay = (dayNum: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNum)) next.delete(dayNum);
      else next.add(dayNum);
      return next;
    });
  };

  // Track city transitions to show city name in header
  const dayCityDisplay = days.map((day, i) => {
    const prevCity = i > 0 ? days[i - 1].city : null;
    if (day.isTravel && day.travelFrom && day.travelTo) {
      return `${day.travelFrom} → ${day.travelTo}`;
    }
    if (day.city !== prevCity && prevCity) {
      return day.city;
    }
    return day.city;
  });

  return (
    <div className="space-y-3">
      {days.map((day, i) => {
        const isExpanded = expandedDays.has(day.day);
        const { label, variant } = getDayType(day, i);

        return (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.25 }}
          >
            {/* Day header — always visible */}
            <button
              onClick={() => toggleDay(day.day)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left ${
                isExpanded
                  ? "bg-amber-50/80 dark:bg-amber-900/10"
                  : "bg-background hover:bg-secondary/50 border border-border"
              }`}
            >
              {/* Day number circle */}
              <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                {day.day}
              </span>

              {/* Day info */}
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-foreground">
                  Day {day.day} – {dayCityDisplay[i]}
                </span>
                <div className="text-xs text-muted-foreground mt-0.5">{day.date}</div>
              </div>

              {/* Type badge */}
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${badgeStyles[variant]}`}>
                {label}
              </span>

              {/* Chevron */}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                isExpanded ? "rotate-180" : ""
              }`} />
            </button>

            {/* Expanded activities */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-b-xl px-4 pb-4 pt-1 -mt-2 space-y-3 border-x border-b border-amber-100 dark:border-amber-900/20">
                    {/* Travel banner */}
                    {day.isTravel && day.travelFrom && day.travelTo && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background rounded-lg px-3 py-2">
                        <Plane className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>
                          {day.travelFrom} → {day.travelTo}
                          {day.travelDuration && <> · {day.travelDuration}</>}
                        </span>
                      </div>
                    )}

                    {day.activities.map((activity, j) => (
                      <div key={j} className="bg-background rounded-lg p-3">
                        <div className="font-semibold text-sm text-foreground">{activity.name}</div>
                        <p className="text-xs text-primary italic mt-0.5">{activity.why}</p>

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          {activity.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {activity.duration}
                            </span>
                          )}
                          {getTransportIcon(activity) && (
                            <span className="flex items-center gap-1">
                              {getTransportIcon(activity)} Walk
                            </span>
                          )}
                          {activity.cost && (
                            <span className="flex items-center gap-1">
                              💰 {activity.cost}
                            </span>
                          )}
                        </div>

                        {activity.food && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">
                            🍽️ {activity.food}
                          </p>
                        )}
                        {activity.tip && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            💡 {activity.tip}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
