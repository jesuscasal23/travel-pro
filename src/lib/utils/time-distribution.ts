import { parseDurationMinutes } from "./duration";
import type { DayActivity, TripDay } from "@/types";

export interface TimedActivity {
  activity: DayActivity;
  startMinutes: number;  // minutes from midnight (e.g., 540 = 9:00)
  endMinutes: number;
  startTime: string;     // "09:00"
  endTime: string;       // "11:00"
  durationMinutes: number;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

const GAP_MINUTES = 30;
const DEFAULT_START = 9 * 60;  // 9:00 AM
const TRAVEL_START = 7 * 60;   // 7:00 AM

export function distributeActivities(day: TripDay): TimedActivity[] {
  let cursor = day.isTravel ? TRAVEL_START : DEFAULT_START;
  return day.activities.map((activity) => {
    const durationMinutes = parseDurationMinutes(activity.duration) || 60;
    const start = cursor;
    const end = cursor + durationMinutes;
    cursor = end + GAP_MINUTES;
    return {
      activity,
      startMinutes: start,
      endMinutes: end,
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
      durationMinutes,
    };
  });
}

/** Get the time range for an entire day's activities */
export function getDayTimeRange(timedActivities: TimedActivity[]): { start: number; end: number } {
  if (timedActivities.length === 0) return { start: DEFAULT_START, end: DEFAULT_START + 480 };
  const start = Math.min(...timedActivities.map((t) => t.startMinutes));
  const end = Math.max(...timedActivities.map((t) => t.endMinutes));
  // Round to hour boundaries
  const startHour = Math.floor(start / 60) * 60;
  const endHour = Math.ceil(end / 60) * 60;
  return { start: startHour, end: Math.max(endHour, startHour + 120) };
}

/** Generate hour markers for the timeline axis */
export function getHourMarkers(start: number, end: number): { minutes: number; label: string }[] {
  const markers: { minutes: number; label: string }[] = [];
  for (let m = start; m <= end; m += 60) {
    markers.push({ minutes: m, label: minutesToTime(m) });
  }
  return markers;
}
