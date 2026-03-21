"use client";

import { memo } from "react";
import { Clock } from "lucide-react";
import { getCategoryStyle, getCategoryEmoji } from "@/lib/utils/format/category-colors";
import type { TimedActivity } from "@/lib/utils/trip/time-distribution";

interface ActivityCardProps {
  timedActivity: TimedActivity;
  isFirst: boolean;
  isLast: boolean;
}

export const ActivityCard = memo(function ActivityCard({
  timedActivity,
  isFirst,
  isLast,
}: ActivityCardProps) {
  const { activity, startTime, endTime, durationMinutes } = timedActivity;
  const style = getCategoryStyle(activity.category);

  const durationHours = durationMinutes / 60;

  return (
    <div
      className={`shadow-glass-xl relative overflow-hidden rounded-[24px] border border-white/80 bg-white/88 px-4 py-4 backdrop-blur-sm ${
        !isLast ? "mb-3" : ""
      }`}
    >
      {/* Category color left accent */}
      <div
        className="absolute top-3 bottom-3 left-0 w-1 rounded-r-full"
        style={{ backgroundColor: style.strokeHsl }}
      />

      <div className="pl-2">
        {/* Header: name + time badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="shadow-inset-white mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm"
              style={{ backgroundColor: style.bgHsl, color: style.strokeHsl }}
            >
              {activity.icon ?? getCategoryEmoji(activity.category)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase ${style.textClass}`}
                  style={{ backgroundColor: style.bgHsl }}
                >
                  {activity.category}
                </span>
              </div>
              <h4 className="text-v2-navy mt-2 truncate text-[15px] font-semibold tracking-[-0.02em]">
                {activity.name}
              </h4>
            </div>
          </div>
          <span
            className="flex-shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.06em]"
            style={{ backgroundColor: style.bgHsl, color: style.strokeHsl }}
          >
            {startTime}–{endTime}
          </span>
        </div>

        {/* Why description */}
        {activity.why && (
          <p className="text-v2-text-muted mt-2 line-clamp-2 text-[13px] leading-5">
            {activity.why}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-3 text-[12px] text-[#7d8ea7]">
          {activity.duration && (
            <span className="flex items-center gap-1 rounded-full bg-[#f4f7fb] px-2.5 py-1">
              <Clock className="h-3 w-3" /> {activity.duration}
            </span>
          )}
        </div>

        {/* Food recommendation — show if duration >= 1.5h */}
        {activity.food && durationHours >= 1.5 && (
          <p className="mt-2 text-[12px] text-[#9a6a10]">🍽️ {activity.food}</p>
        )}

        {/* Pro tip — show if duration >= 2h */}
        {activity.tip && durationHours >= 2 && (
          <p className="text-v2-text-muted mt-1.5 text-[12px] italic">💡 {activity.tip}</p>
        )}
      </div>
    </div>
  );
});
