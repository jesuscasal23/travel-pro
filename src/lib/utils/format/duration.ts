/** Parse a duration string like "2h", "1.5h", "2h 15min", "45min" into total minutes */
export function parseDurationMinutes(duration: string): number {
  if (!duration) return 0;
  const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*h/i);
  const minMatch = duration.match(/(\d+)\s*min/i);
  let totalMinutes = 0;
  if (hourMatch) totalMinutes += parseFloat(hourMatch[1]) * 60;
  if (minMatch) totalMinutes += parseInt(minMatch[1]);
  if (!hourMatch && !minMatch) {
    const bare = parseFloat(duration);
    if (!isNaN(bare)) totalMinutes = bare * 60;
  }
  return totalMinutes;
}

/** Format minutes to display string: "2h 15min" */
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
