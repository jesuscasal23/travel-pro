"use client";

import { Clock } from "lucide-react";
import { getCategoryStyle, getCategoryEmoji } from "@/lib/utils/category-colors";
import { parseDurationMinutes } from "@/lib/utils/duration";
import type { TimedActivity } from "@/lib/utils/time-distribution";

interface ActivityCardProps {
  timedActivity: TimedActivity;
  isFirst: boolean;
  isLast: boolean;
}

export function ActivityCard({ timedActivity, isFirst, isLast }: ActivityCardProps) {
  const { activity, startTime, endTime, durationMinutes } = timedActivity;
  const style = getCategoryStyle(activity.category);

  const durationHours = durationMinutes / 60;

  return (
    <div
      className={`border-border bg-card relative border-x border-t px-4 py-3 ${
        isFirst ? "rounded-t-xl" : ""
      } ${isLast ? "rounded-b-xl border-b" : ""}`}
    >
      {/* Category color left accent */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1 ${style.bgClass} ${
          isFirst ? "rounded-tl-xl" : ""
        } ${isLast ? "rounded-bl-xl" : ""}`}
      />

      <div className="pl-2">
        {/* Header: name + time badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex-shrink-0 text-sm">
              {activity.icon ?? getCategoryEmoji(activity.category)}
            </span>
            <h4 className="text-foreground truncate text-sm font-semibold">{activity.name}</h4>
          </div>
          <span
            className={`flex-shrink-0 ${style.badgeBg} rounded-full px-2 py-0.5 font-mono text-[10px] font-medium text-white`}
          >
            {startTime}–{endTime}
          </span>
        </div>

        {/* Why description */}
        {activity.why && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{activity.why}</p>
        )}

        {/* Meta row */}
        <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
          {activity.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {activity.duration}
            </span>
          )}
        </div>

        {/* Food recommendation — show if duration >= 1.5h */}
        {activity.food && durationHours >= 1.5 && (
          <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">🍽️ {activity.food}</p>
        )}

        {/* Pro tip — show if duration >= 2h */}
        {activity.tip && durationHours >= 2 && (
          <p className="text-muted-foreground mt-1 text-xs italic">💡 {activity.tip}</p>
        )}
      </div>
    </div>
  );
}
