import { describe, it, expect } from "vitest";
import { distributeActivities, getDayTimeRange, getHourMarkers } from "../trip/time-distribution";
import type { TripDay } from "@/types";

describe("time-distribution", () => {
  it("distributes activities from 09:00 with parsed durations and 30-minute gaps", () => {
    const day: TripDay = {
      day: 1,
      date: "2026-06-01",
      city: "Paris",
      activities: [
        { name: "Museum", category: "Culture", why: "", duration: "2h" },
        { name: "Lunch", category: "Food", why: "", duration: "45min" },
      ],
    };

    const timed = distributeActivities(day);
    expect(timed[0].startTime).toBe("09:00");
    expect(timed[0].endTime).toBe("11:00");
    expect(timed[1].startTime).toBe("11:30");
    expect(timed[1].endTime).toBe("12:15");
  });

  it("starts travel days at 07:00 and defaults invalid durations to 60 minutes", () => {
    const day: TripDay = {
      day: 2,
      date: "2026-06-02",
      city: "Rome",
      isTravel: true,
      activities: [{ name: "Transfer", category: "Transit", why: "", duration: "n/a" }],
    };

    const timed = distributeActivities(day);
    expect(timed[0].startTime).toBe("07:00");
    expect(timed[0].durationMinutes).toBe(60);
    expect(timed[0].endTime).toBe("08:00");
  });

  it("returns default range for empty timelines", () => {
    expect(getDayTimeRange([])).toEqual({ start: 540, end: 1020 });
  });

  it("rounds time range to hours and enforces a minimum 2-hour window", () => {
    const range = getDayTimeRange([
      {
        activity: { name: "A", category: "General", why: "", duration: "15m" },
        startMinutes: 615,
        endMinutes: 630,
        startTime: "10:15",
        endTime: "10:30",
        durationMinutes: 15,
      },
    ]);

    expect(range).toEqual({ start: 600, end: 720 });
  });

  it("generates hourly markers between start and end boundaries", () => {
    const markers = getHourMarkers(540, 720);
    expect(markers).toEqual([
      { minutes: 540, label: "09:00" },
      { minutes: 600, label: "10:00" },
      { minutes: 660, label: "11:00" },
      { minutes: 720, label: "12:00" },
    ]);
  });
});
