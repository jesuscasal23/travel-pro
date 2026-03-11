/**
 * Shared date utility functions.
 * Consolidates scattered date helpers from prompts/v1, prompts/v2,
 * prompts/route-selector, and flights/optimizer.
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
