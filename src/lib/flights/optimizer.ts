// ============================================================
// Travel Pro — Flight Date Optimizer
//
// Given a list of cities with flexible day ranges, finds the
// date assignment that minimises total flight cost.
//
// Model (0-indexed days from startDate):
//   Day 0               = outbound (home → city[0])           FIXED
//   Day k+1+Σd[0..k]   = inter-city leg k→k+1                VARIABLE
//   Day totalDays-1     = return (city[N-1] → home)           FIXED
//
// Target city-days = totalDays - 1 - N  (N = number of cities)
// ============================================================

import { searchFlights as amadeusSearchFlights } from "./amadeus";
import { searchFlights as serpApiSearchFlights } from "./serpapi";
import { getOptionalSerpApiEnv } from "@/lib/config/server-env";
import type { CityWithDays, OptimizedLeg, FlightSkeleton, FlightOption } from "./types";
import { addDays } from "@/lib/utils/date";

/** Use SerpApi when configured, fall back to Amadeus. */
function searchFlights(
  origin: string,
  destination: string,
  date: string,
  travelers: number,
  signal?: AbortSignal
): Promise<FlightOption | null> {
  const serpApi = getOptionalSerpApiEnv();
  if (serpApi) {
    return serpApiSearchFlights(serpApi.apiKey, origin, destination, date, travelers, signal);
  }
  return amadeusSearchFlights(origin, destination, date, travelers, signal);
}

/** Enumerate all feasible day assignments where the sum equals target. */
function* generateAssignments(
  cities: CityWithDays[],
  target: number,
  idx = 0,
  current: number[] = []
): Generator<number[]> {
  if (idx === cities.length) {
    if (current.reduce((a, b) => a + b, 0) === target) yield [...current];
    return;
  }
  const { minDays, maxDays } = cities[idx];
  const rest = cities.slice(idx + 1);
  const minRest = rest.reduce((s, c) => s + c.minDays, 0);
  const maxRest = rest.reduce((s, c) => s + c.maxDays, 0);

  for (let d = minDays; d <= maxDays; d++) {
    const remaining = target - d;
    if (remaining < minRest || remaining > maxRest) continue;
    yield* generateAssignments(cities, target, idx + 1, [...current, d]);
  }
}

/**
 * Find the day assignment that minimises total flight cost.
 *
 * @param homeIata     - IATA code of the traveller's home airport
 * @param cities       - ordered city list from Haiku route-selector
 * @param startDateStr - YYYY-MM-DD trip start date
 * @param totalDays    - total trip length in days (inclusive)
 * @param travelers    - number of adult travelers
 */
export async function optimizeFlights(
  homeIata: string,
  cities: CityWithDays[],
  startDateStr: string,
  totalDays: number,
  travelers: number
): Promise<FlightSkeleton> {
  const N = cities.length;

  // City-days target: total minus one travel day per flight leg
  const rawTarget = totalDays - 1 - N;
  const minTotal = cities.reduce((s, c) => s + c.minDays, 0);
  const maxTotal = cities.reduce((s, c) => s + c.maxDays, 0);
  const target = Math.max(minTotal, Math.min(maxTotal, rawTarget));

  const assignments = [...generateAssignments(cities, target)];
  if (assignments.length === 0) {
    // Fallback: distribute evenly within constraints
    const perCity = Math.max(Math.round(target / N), 1);
    assignments.push(cities.map((c) => Math.min(c.maxDays, Math.max(c.minDays, perCity))));
  }

  // ── Pre-fetch all needed flight prices in parallel ──────────
  type PriceCacheEntry = { price: number; duration: string; airline: string } | null;
  const priceMap = new Map<string, PriceCacheEntry>();
  const fetchPromises: Promise<void>[] = [];

  function queueFetch(origin: string, dest: string, date: string) {
    const key = `${origin}:${dest}:${date}`;
    if (!priceMap.has(key)) {
      priceMap.set(key, null);
      fetchPromises.push(
        searchFlights(origin, dest, date, travelers).then((r) => {
          priceMap.set(key, r);
        })
      );
    }
  }

  const returnDate = addDays(startDateStr, totalDays - 1);

  // Fixed legs (same for every assignment)
  queueFetch(homeIata, cities[0].iataCode, startDateStr);
  queueFetch(cities[N - 1].iataCode, homeIata, returnDate);

  // Variable inter-city legs — pre-fetch all possible departure dates
  for (let k = 0; k < N - 1; k++) {
    const minCumulative = cities.slice(0, k + 1).reduce((s, c) => s + c.minDays, 0);
    const maxCumulative = cities.slice(0, k + 1).reduce((s, c) => s + c.maxDays, 0);
    const minOffset = k + 1 + minCumulative;
    const maxOffset = k + 1 + maxCumulative;

    for (let offset = minOffset; offset <= maxOffset; offset++) {
      queueFetch(cities[k].iataCode, cities[k + 1].iataCode, addDays(startDateStr, offset));
    }
  }

  await Promise.all(fetchPromises);

  // ── Find cheapest feasible assignment ───────────────────────
  let bestCost = Infinity;
  let bestAssignment = assignments[0];
  let validCostSum = 0;
  let validCostCount = 0;

  for (const assignment of assignments) {
    let cost = 0;
    let ok = true;

    // Outbound (fixed)
    const ob = priceMap.get(`${homeIata}:${cities[0].iataCode}:${startDateStr}`);
    if (!ob) {
      ok = false;
    } else cost += ob.price;

    // Inter-city legs
    let cumulative = 0;
    for (let k = 0; k < N - 1 && ok; k++) {
      cumulative += assignment[k];
      const date = addDays(startDateStr, k + 1 + cumulative);
      const f = priceMap.get(`${cities[k].iataCode}:${cities[k + 1].iataCode}:${date}`);
      if (!f) {
        ok = false;
      } else cost += f.price;
    }

    // Return (fixed date, variable leg)
    const ret = priceMap.get(`${cities[N - 1].iataCode}:${homeIata}:${returnDate}`);
    if (!ret) {
      ok = false;
    } else cost += ret.price;

    if (ok) {
      validCostSum += cost;
      validCostCount++;
      if (cost < bestCost) {
        bestCost = cost;
        bestAssignment = assignment;
      }
    }
  }

  // Average cost across all valid assignments — baseline for savings display
  const averageCost = validCostCount > 1 ? Math.round(validCostSum / validCostCount) : undefined;

  // ── Build leg objects ────────────────────────────────────────
  function makeLeg(
    fromCity: string,
    toCity: string,
    fromIata: string,
    toIata: string,
    date: string
  ): OptimizedLeg {
    const f = priceMap.get(`${fromIata}:${toIata}:${date}`);
    return {
      fromCity,
      toCity,
      fromIata,
      toIata,
      departureDate: date,
      price: f?.price ?? 0,
      duration: f?.duration ?? "unknown",
      airline: f?.airline ?? "?",
    };
  }

  const legs: OptimizedLeg[] = [];

  // Outbound
  legs.push(makeLeg("Home", cities[0].city, homeIata, cities[0].iataCode, startDateStr));

  // Inter-city
  let cumulative = 0;
  for (let k = 0; k < N - 1; k++) {
    cumulative += bestAssignment[k];
    const date = addDays(startDateStr, k + 1 + cumulative);
    legs.push(
      makeLeg(cities[k].city, cities[k + 1].city, cities[k].iataCode, cities[k + 1].iataCode, date)
    );
  }

  // Return
  legs.push(makeLeg(cities[N - 1].city, "Home", cities[N - 1].iataCode, homeIata, returnDate));

  return {
    homeIata,
    legs,
    totalFlightCost: bestCost === Infinity ? 0 : bestCost,
    dayAssignment: bestAssignment,
    // Only set when we actually found a cheaper combination than average
    ...(averageCost !== undefined && bestCost !== Infinity && averageCost > bestCost
      ? { baselineCost: averageCost }
      : {}),
  };
}
