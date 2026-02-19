// @vitest-environment node
import { describe, it, expect } from "vitest";
import { daysBetween, addDays, formatDateShort } from "../date";

describe("daysBetween", () => {
  it("returns correct days between two dates", () => {
    expect(daysBetween("2026-03-01", "2026-03-10")).toBe(9);
  });

  it("returns 0 for the same date", () => {
    expect(daysBetween("2026-03-01", "2026-03-01")).toBe(0);
  });

  it("handles month boundaries", () => {
    expect(daysBetween("2026-01-28", "2026-02-03")).toBe(6);
  });

  it("handles year boundaries", () => {
    expect(daysBetween("2025-12-30", "2026-01-02")).toBe(3);
  });

  it("handles leap year", () => {
    // 2028 is a leap year
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });
});

describe("addDays", () => {
  it("adds days to a date", () => {
    expect(addDays("2026-03-01", 5)).toBe("2026-03-06");
  });

  it("handles month rollover", () => {
    expect(addDays("2026-03-30", 3)).toBe("2026-04-02");
  });

  it("handles year rollover", () => {
    expect(addDays("2025-12-30", 5)).toBe("2026-01-04");
  });

  it("handles negative days", () => {
    expect(addDays("2026-03-10", -3)).toBe("2026-03-07");
  });

  it("returns same date for 0 days", () => {
    expect(addDays("2026-03-15", 0)).toBe("2026-03-15");
  });
});

describe("formatDateShort", () => {
  it('formats to "Mon DD" style', () => {
    const result = formatDateShort("2026-03-15");
    expect(result).toBe("Mar 15");
  });

  it("handles January", () => {
    expect(formatDateShort("2026-01-01")).toBe("Jan 1");
  });

  it("handles December", () => {
    expect(formatDateShort("2026-12-25")).toBe("Dec 25");
  });
});
