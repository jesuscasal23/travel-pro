import type { CityStop } from "@/types";

export function getDiscoverableCities(route: CityStop[]): CityStop[] {
  return route.filter((city, idx) => {
    const isLast = idx === route.length - 1;
    const nonTravelDays = isLast ? city.days : Math.max(0, city.days - 1);
    return nonTravelDays > 0;
  });
}

export function arraysEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

interface ReachabilityMeta {
  filtered: number;
  verifiedFiltered: number;
  autoRegenerated: boolean;
}

export function formatReachabilityNotice(reachability?: ReachabilityMeta): string | null {
  if (!reachability) return null;
  if (reachability.autoRegenerated) {
    return "We refreshed these picks so everything stays within an hour of the city center.";
  }
  const filteredTotal = (reachability.filtered ?? 0) + (reachability.verifiedFiltered ?? 0);
  if (filteredTotal > 0) {
    return "We removed a few far-away ideas to keep recommendations close by.";
  }
  return null;
}
