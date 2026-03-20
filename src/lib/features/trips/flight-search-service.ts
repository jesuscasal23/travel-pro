import { ApiError } from "@/lib/api/errors";
import {
  SerpApiRateLimitError,
  searchFlightsMulti as serpApiSearchMulti,
} from "@/lib/flights/serpapi";
import { getOptionalSerpApiEnv } from "@/lib/config/server-env";
import { createLogger } from "@/lib/core/logger";
import { z } from "zod";
import { FlightSearchInputSchema } from "./schemas";

const log = createLogger("flight-search");

type FlightSearchInput = z.infer<typeof FlightSearchInputSchema>;

export async function searchTripFlights(input: FlightSearchInput) {
  const filters =
    input.nonStop || input.maxPrice
      ? { nonStop: input.nonStop, maxPrice: input.maxPrice }
      : undefined;

  const serpApi = getOptionalSerpApiEnv();

  if (!serpApi) {
    log.warn("SerpApi not configured — returning empty flight results", {
      from: input.fromIata,
      to: input.toIata,
      date: input.departureDate,
    });
    return {
      fromIata: input.fromIata,
      toIata: input.toIata,
      departureDate: input.departureDate,
      results: [],
      fetchedAt: Date.now(),
    };
  }

  try {
    log.info("Using SerpApi Google Flights", {
      from: input.fromIata,
      to: input.toIata,
      date: input.departureDate,
    });
    const results = await serpApiSearchMulti(
      serpApi.apiKey,
      input.fromIata,
      input.toIata,
      input.departureDate,
      input.travelers,
      filters
    );

    return {
      fromIata: input.fromIata,
      toIata: input.toIata,
      departureDate: input.departureDate,
      results,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof SerpApiRateLimitError) {
      throw new ApiError(429, error.message, { provider: "serpapi" }, "serpapi_rate_limit");
    }
    throw error;
  }
}
