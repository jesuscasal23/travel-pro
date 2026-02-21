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

      {/* Timeline axis with line */}
      <div className="relative h-4">
        {/* Horizontal line spanning the full axis */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2" />
        {hourMarkers.map((marker) => {
          const pos = getPosition(marker.minutes);
          return (
            <div
              key={marker.minutes}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-border z-[1]"
              style={{ left: `${pos}%` }}
            />
          );
        })}
        {/* Activity start dots */}
        {timedActivities.map((ta, i) => {
          const startPos = getPosition(ta.startMinutes);
          const endPos = getPosition(ta.endMinutes);
          const style = getCategoryStyle(ta.activity.category);
          return (
            <div key={i}>
              <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-background z-10"
                style={{ left: `${startPos}%`, backgroundColor: style.strokeHsl }}
              />
              <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-background z-10"
                style={{ left: `${endPos}%`, backgroundColor: style.strokeHsl }}
              />
            </div>
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

  // Calculate block start/end positions (cumulative widths) and draw both connectors
  let cumWidth = 0;
  timedActivities.forEach((ta) => {
    const blockStart = (cumWidth / totalActivityMinutes) * 100;
    cumWidth += ta.durationMinutes;
    const blockEnd = (cumWidth / totalActivityMinutes) * 100;

    const cpY = height * 0.5;

    // Start-time connector: from start time on axis to block left edge
    const x1 = getPosition(ta.startMinutes);
    paths.push(`M ${x1} 0 C ${x1} ${cpY}, ${blockStart} ${cpY}, ${blockStart} ${height}`);

    // End-time connector: from end time on axis to block right edge
    const x2 = getPosition(ta.endMinutes);
    paths.push(`M ${x2} 0 C ${x2} ${cpY}, ${blockEnd} ${cpY}, ${blockEnd} ${height}`);
  });

  return (
    <svg
      className="w-full overflow-visible"
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      style={{ height: `${height}px` }}
    >
      {paths.map((d, i) => {
        const style = getCategoryStyle(timedActivities[Math.floor(i / 2)].activity.category);
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
