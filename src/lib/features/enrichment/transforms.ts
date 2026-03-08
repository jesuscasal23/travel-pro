import type { CityStop } from "@/types";

export function buildSyntheticCityStops(route: Array<Omit<CityStop, "id" | "days">>): CityStop[] {
  return route.map((stop, index) => ({ id: String(index), days: 0, ...stop }));
}
