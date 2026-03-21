/**
 * Shared date utility functions.
 * Consolidates scattered date helpers from prompts, route-selector,
 * and flights/optimizer.
 */

/** Calculate number of days between two ISO date strings (YYYY-MM-DD). */
export function daysBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
}

/** Add N days to an ISO date string, return YYYY-MM-DD. */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Format ISO date string as short date (e.g. "Mar 15"). */
export function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Format a start–end date pair as a short range (e.g. "Mar 15 – Mar 22"). */
export function formatDateRange(start?: string, end?: string): string {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}

/** Number of days from now until the given date, or null if the date is in the past. */
export function daysUntil(dateStr: string): number | null {
  const targetUtc = new Date(dateStr + "T00:00:00Z").getTime();
  const nowUtc = Date.now();
  const diff = Math.ceil((targetUtc - nowUtc) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}
