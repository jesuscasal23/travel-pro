import type { CityStop, TripDay, TripBudget } from "@/types";

export interface CityBudgetRow {
  city: string;
  country: string;
  days: number;
  stays: number;
  activities: number;
  food: number;
  transport: number;
  total: number;
}

/** Parse a cost string like "€25", "€20–30", "~€12", "Free" into a number */
export function parseCostString(cost: string | undefined): number {
  if (!cost) return 0;
  const cleaned = cost.replace(/[^0-9.,–\-]/g, "");
  if (!cleaned) return 0;
  const parts = cleaned.split(/[–\-]/);
  if (parts.length === 2) {
    const low = parseFloat(parts[0]);
    const high = parseFloat(parts[1]);
    if (!isNaN(low) && !isNaN(high)) return (low + high) / 2;
  }
  return parseFloat(cleaned) || 0;
}

export function deriveCityBudgets(
  route: CityStop[],
  days: TripDay[],
  budget: TripBudget
): CityBudgetRow[] {
  const totalDays = days.length || 1;

  const cityDayMap = new Map<string, TripDay[]>();
  for (const day of days) {
    const existing = cityDayMap.get(day.city) ?? [];
    existing.push(day);
    cityDayMap.set(day.city, existing);
  }

  return route.map((stop) => {
    const cityDays = cityDayMap.get(stop.city)?.length ?? stop.days;
    const dayRatio = cityDays / totalDays;
    const stays = Math.round(dayRatio * budget.accommodation);
    const activitySum = (cityDayMap.get(stop.city) ?? []).reduce(
      (acc, d) => acc + d.activities.reduce((a, act) => a + parseCostString(act.cost), 0),
      0
    );
    const activities = activitySum > 0 ? Math.round(activitySum) : Math.round(dayRatio * budget.activities);
    const food = Math.round(dayRatio * budget.food);
    const transport = Math.round(dayRatio * budget.transport);

    return {
      city: stop.city,
      country: stop.country,
      days: cityDays,
      stays,
      activities,
      food,
      transport,
      total: stays + activities + food + transport,
    };
  });
}
