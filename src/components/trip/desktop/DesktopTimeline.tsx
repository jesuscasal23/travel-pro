"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { getCategoryStyle } from "@/lib/utils/category-colors";
import { distributeActivities, getDayTimeRange, getHourMarkers } from "@/lib/utils/time-distribution";
import type { TripDay } from "@/types";
import type { TimedActivity } from "@/lib/utils/time-distribution";

interface DesktopTimelineProps {
  day: TripDay;
}

export function DesktopTimeline({ day }: DesktopTimelineProps) {
  const timedActivities = useMemo(() => distributeActivities(day), [day]);
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getDayTimeRange(timedActivities),
    [timedActivities]
  );
  const hourMarkers = useMemo(
    () => getHourMarkers(rangeStart, rangeEnd),
    [rangeStart, rangeEnd]
  );

  const totalRange = rangeEnd - rangeStart;
  if (totalRange === 0 || timedActivities.length === 0) return null;

  // Calculate position as percentage of total range
  const getPosition = (minutes: number) => ((minutes - rangeStart) / totalRange) * 100;

  // Activity block widths (proportional to duration)
  const totalActivityMinutes = timedActivities.reduce((sum, ta) => sum + ta.durationMinutes, 0);

  return (
    <div className="mt-4 mb-2">
      {/* Time axis */}
      <div className="relative h-8 mb-1">
        {hourMarkers.map((marker) => {
          const pos = getPosition(marker.minutes);
          return (
            <div
              key={marker.minutes}
              className="absolute top-0 -translate-x-1/2 text-[10px] text-muted-foreground font-mono"
              style={{ left: `${pos}%` }}
            >
              {marker.label}
            </div>
          );
        })}
      </div>

      {/* Connector dots on axis */}
      <div className="relative h-4">
        {hourMarkers.map((marker) => {
          const pos = getPosition(marker.minutes);
          return (
            <div
              key={marker.minutes}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-border"
              style={{ left: `${pos}%` }}
            />
          );
        })}
        {/* Activity start dots */}
        {timedActivities.map((ta, i) => {
          const pos = getPosition(ta.startMinutes);
          const style = getCategoryStyle(ta.activity.category);
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-background z-10"
              style={{ left: `${pos}%`, backgroundColor: style.strokeHsl }}
            />
          );
        })}
      </div>

      {/* SVG bezier connectors */}
      <SVGConnectors
        timedActivities={timedActivities}
        totalActivityMinutes={totalActivityMinutes}
        getPosition={getPosition}
      />

      {/* Proportional activity blocks */}
      <div className="flex gap-1 mt-1">
        {timedActivities.map((ta, i) => {
          const widthPercent = (ta.durationMinutes / totalActivityMinutes) * 100;
          const style = getCategoryStyle(ta.activity.category);
          const durationHours = ta.durationMinutes / 60;

          return (
            <div
              key={i}
              className="relative rounded-xl p-3 overflow-hidden min-h-[80px]"
              style={{
                width: `${widthPercent}%`,
                backgroundColor: style.bgHsl,
                borderLeft: `3px solid ${style.strokeHsl}`,
              }}
            >
              <div className="flex items-start gap-1.5 min-w-0">
                <span className="text-xs flex-shrink-0">{ta.activity.icon}</span>
                <h4 className={`text-xs font-semibold truncate ${style.textClass}`}>
                  {ta.activity.name}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                <Clock className="w-2.5 h-2.5" />
                <span>{ta.activity.duration}</span>
                {ta.activity.cost && (
                  <>
                    <span>·</span>
                    <span className="font-medium">{ta.activity.cost}</span>
                  </>
                )}
              </div>
              {ta.activity.why && widthPercent > 20 && (
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  {ta.activity.why}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** SVG overlay with bezier curves from time positions to block positions */
function SVGConnectors({
  timedActivities,
  totalActivityMinutes,
  getPosition,
}: {
  timedActivities: TimedActivity[];
  totalActivityMinutes: number;
  getPosition: (minutes: number) => number;
}) {
  if (timedActivities.length === 0) return null;

  const height = 24;
  const paths: string[] = [];

  // Calculate block start positions (cumulative widths)
  let cumWidth = 0;
  timedActivities.forEach((ta, i) => {
    const timePos = getPosition(ta.startMinutes);
    const blockPos = (cumWidth / totalActivityMinutes) * 100;
    cumWidth += ta.durationMinutes;

    // SVG bezier curve from (timePos, 0) to (blockPos, height)
    const x1 = timePos;
    const y1 = 0;
    const x2 = blockPos;
    const y2 = height;
    const cpY = height * 0.5;

    paths.push(`M ${x1} ${y1} C ${x1} ${cpY}, ${x2} ${cpY}, ${x2} ${y2}`);
  });

  return (
    <svg
      className="w-full overflow-visible"
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      style={{ height: `${height}px` }}
    >
      {paths.map((d, i) => {
        const style = getCategoryStyle(timedActivities[i].activity.category);
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={style.strokeHsl}
            strokeWidth="0.3"
            opacity={0.5}
          />
        );
      })}
    </svg>
  );
}
