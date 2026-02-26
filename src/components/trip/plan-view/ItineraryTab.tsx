"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Footprints, Bus, TrainFront, Plane } from "lucide-react";
import type { TripDay, CityStop } from "@/types";

interface ItineraryTabProps {
  days: TripDay[];
  route: CityStop[];
}

function getDayType(
  day: TripDay,
  index: number
): { label: string; variant: "arrival" | "full" | "travel" } {
  if (index === 0) return { label: "Arrival", variant: "arrival" };
  if (day.isTravel) return { label: "Travel day", variant: "travel" };
  return { label: "Full day", variant: "full" };
}

const badgeStyles = {
  arrival: "bg-primary/10 text-primary border border-primary/20",
  full: "bg-primary/10 text-primary border border-primary/20",
  travel:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-700",
};

function getTransportIcon(activity: { name: string; category: string }) {
  const name = activity.name.toLowerCase();
  if (/walk|stroll/.test(name)) return <Footprints className="h-3 w-3" />;
  if (/bus/.test(name)) return <Bus className="h-3 w-3" />;
  if (/train|shinkansen|rail/.test(name)) return <TrainFront className="h-3 w-3" />;
  if (/flight|fly|airport/.test(name)) return <Plane className="h-3 w-3" />;
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
              className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all duration-200 ${
                isExpanded
                  ? "bg-amber-50/80 dark:bg-amber-900/10"
                  : "bg-background hover:bg-secondary/50 border-border border"
              }`}
            >
              {/* Day number circle */}
              <span className="bg-primary text-primary-foreground flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {day.day}
              </span>

              {/* Day info */}
              <div className="min-w-0 flex-1">
                <span className="text-foreground font-semibold">
                  {route.length === 1 ? `Day ${day.day}` : `Day ${day.day} – ${dayCityDisplay[i]}`}
                </span>
                <div className="text-muted-foreground mt-0.5 text-xs">{day.date}</div>
              </div>

              {/* Type badge */}
              <span
                className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${badgeStyles[variant]}`}
              >
                {label}
              </span>

              {/* Chevron */}
              <ChevronDown
                className={`text-muted-foreground h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
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
                  <div className="-mt-2 space-y-3 rounded-b-xl border-x border-b border-amber-100 bg-amber-50/50 px-4 pt-1 pb-4 dark:border-amber-900/20 dark:bg-amber-900/10">
                    {/* Travel banner */}
                    {day.isTravel && day.travelFrom && day.travelTo && (
                      <div className="text-muted-foreground bg-background flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
                        <Plane className="text-primary h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                          {day.travelFrom} → {day.travelTo}
                          {day.travelDuration && <> · {day.travelDuration}</>}
                        </span>
                      </div>
                    )}

                    {day.activities.map((activity, j) => (
                      <div key={j} className="bg-background rounded-lg p-3">
                        <div className="text-foreground text-sm font-semibold">{activity.name}</div>
                        <p className="text-primary mt-0.5 text-xs italic">{activity.why}</p>

                        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-xs">
                          {activity.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {activity.duration}
                            </span>
                          )}
                          {getTransportIcon(activity) && (
                            <span className="flex items-center gap-1">
                              {getTransportIcon(activity)} Walk
                            </span>
                          )}
                        </div>

                        {activity.food && (
                          <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
                            🍽️ {activity.food}
                          </p>
                        )}
                        {activity.tip && (
                          <p className="text-muted-foreground mt-1 text-xs italic">
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
