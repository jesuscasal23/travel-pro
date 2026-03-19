import { ApiError } from "@/lib/api/errors";
import {
  AmadeusRateLimitError,
  searchFlightsMulti as amadeusSearchMulti,
} from "@/lib/flights/amadeus";
import {
  SerpApiRateLimitError,
  searchFlightsMulti as serpApiSearchMulti,
} from "@/lib/flights/serpapi";
import { getOptionalSerpApiEnv } from "@/lib/config/server-env";
import { createLogger } from "@/lib/core/logger";
import { z } from "zod";
import { FlightSearchInputSchema } from "./schemas";

const log = createLogger("flight-search");

export type FlightSearchInput = z.infer<typeof FlightSearchInputSchema>;

export async function searchTripFlights(input: FlightSearchInput) {
  const filters =
    input.nonStop || input.maxPrice
      ? { nonStop: input.nonStop, maxPrice: input.maxPrice }
      : undefined;

  const serpApi = getOptionalSerpApiEnv();

  try {
    let results;

    if (serpApi) {
      log.info("Using SerpApi Google Flights", {
        from: input.fromIata,
        to: input.toIata,
        date: input.departureDate,
      });
      results = await serpApiSearchMulti(
        serpApi.apiKey,
        input.fromIata,
        input.toIata,
        input.departureDate,
        input.travelers,
        filters
      );
    } else {
      results = await amadeusSearchMulti(
        input.fromIata,
        input.toIata,
        input.departureDate,
        input.travelers,
        filters
      );
    }

    return {
      fromIata: input.fromIata,
      toIata: input.toIata,
      departureDate: input.departureDate,
      results,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof AmadeusRateLimitError || error instanceof SerpApiRateLimitError) {
      const provider = error instanceof SerpApiRateLimitError ? "serpapi" : "amadeus";
      throw new ApiError(429, error.message, { provider }, `${provider}_rate_limit`);
    }
    throw error;
  }
}
