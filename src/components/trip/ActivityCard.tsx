"use client";

import { Clock } from "lucide-react";
import { getCategoryStyle } from "@/lib/utils/category-colors";
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
      className={`relative border-x border-t border-border bg-card px-4 py-3 ${
        isFirst ? "rounded-t-xl" : ""
      } ${isLast ? "border-b rounded-b-xl" : ""}`}
    >
      {/* Category color left accent */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${style.bgClass} ${
          isFirst ? "rounded-tl-xl" : ""
        } ${isLast ? "rounded-bl-xl" : ""}`}
      />

      <div className="pl-2">
        {/* Header: name + time badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm flex-shrink-0">{activity.icon}</span>
            <h4 className="font-semibold text-sm text-foreground truncate">{activity.name}</h4>
          </div>
          <span className={`flex-shrink-0 ${style.badgeBg} text-white font-mono text-[10px] font-medium px-2 py-0.5 rounded-full`}>
            {startTime}–{endTime}
          </span>
        </div>

        {/* Why description */}
        {activity.why && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.why}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {activity.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {activity.duration}
            </span>
          )}
          {activity.cost && (
            <span>· {activity.cost}</span>
          )}
        </div>

        {/* Food recommendation — show if duration >= 1.5h */}
        {activity.food && durationHours >= 1.5 && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">
            🍽️ {activity.food}
          </p>
        )}

        {/* Pro tip — show if duration >= 2h */}
        {activity.tip && durationHours >= 2 && (
          <p className="text-xs text-muted-foreground italic mt-1">
            💡 {activity.tip}
          </p>
        )}
      </div>
    </div>
  );
}
