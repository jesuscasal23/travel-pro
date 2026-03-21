"use client";

import { useRef, useCallback } from "react";
import type { TripDay } from "@/types";

interface DayPillsProps {
  days: TripDay[];
  activeDay: number;
  onDayClick: (dayNum: number) => void;
}

export function DayPills({ days, activeDay, onDayClick }: DayPillsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = days.findIndex((d) => d.day === activeDay);
      if (idx === -1) return;

      let next = idx;
      if (e.key === "ArrowRight") next = Math.min(idx + 1, days.length - 1);
      else if (e.key === "ArrowLeft") next = Math.max(idx - 1, 0);
      else return;

      e.preventDefault();
      onDayClick(days[next].day);
      // Move focus to the newly active pill
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]");
      buttons?.[next]?.focus();
    },
    [days, activeDay, onDayClick]
  );

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Day selector"
      onKeyDown={handleKeyDown}
      className="scrollbar-hide flex gap-2 overflow-x-auto py-3"
    >
      {days.map((day) => {
        const isActive = activeDay === day.day;
        return (
          <button
            key={day.day}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onDayClick(day.day)}
            className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? "border-brand-primary bg-brand-primary text-white shadow-[var(--shadow-brand-sm)]"
                : "hover:border-brand-primary-border hover:bg-brand-primary-soft hover:text-brand-primary text-dim border-white/80 bg-white/82"
            }`}
          >
            Day {day.day}
          </button>
        );
      })}
    </div>
  );
}
