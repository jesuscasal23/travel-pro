import { parseIataCode } from "@/lib/affiliate/link-generator";
import { BadRequestError, UpstreamServiceError } from "@/lib/api/errors";
import { optimizeFlights } from "@/lib/flights/optimizer";
import { buildOptimizerCities, resolveRouteIataCodes } from "@/lib/flights/route-utils";
import type { FlightSkeleton } from "@/lib/flights/types";
import type { CityStop } from "@/types";

interface OptimizeTripFlightsInput {
  homeAirport: string;
  route: (CityStop & { days: number })[];
  dateStart: string;
  dateEnd: string;
  travelers?: number;
}

export async function optimizeTripFlights(
  input: OptimizeTripFlightsInput
): Promise<FlightSkeleton> {
  const homeIata = parseIataCode(input.homeAirport);
  if (!homeIata) {
    throw new BadRequestError("Could not parse home airport IATA code", {
      homeAirport: input.homeAirport,
    });
  }

  const { resolvedRoute, missingCities } = resolveRouteIataCodes(input.route);
  if (missingCities.length > 0) {
    throw new BadRequestError(`Could not resolve IATA codes for: ${missingCities.join(", ")}`, {
      missingCities,
    });
  }

  const totalDays = Math.round(
    (new Date(input.dateEnd).getTime() - new Date(input.dateStart).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  try {
    return await optimizeFlights(
      homeIata,
      buildOptimizerCities(resolvedRoute),
      input.dateStart,
      totalDays,
      input.travelers ?? 1
    );
  } catch {
    throw new UpstreamServiceError(
      "Flight optimization failed — Amadeus may not be configured or available"
    );
  }
}
