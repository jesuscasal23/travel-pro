/**
 * Maps city names to timeline dot colors.
 * Used in the day-by-day timeline to visually distinguish cities.
 */
const cityColorMap: Record<string, string> = {
  Tokyo: "bg-primary",
  Kyoto: "bg-primary/80",
  Hanoi: "bg-accent",
  "Ha Long Bay": "bg-accent/80",
  Bangkok: "bg-primary/60",
  "Chiang Mai": "bg-primary/70",
  Phuket: "bg-accent/60",
};

export function getCityColor(city: string): string {
  return cityColorMap[city] ?? "bg-primary";
}
