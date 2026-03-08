import { ApiError } from "@/lib/api/errors";
import { AmadeusRateLimitError, searchFlightsMulti } from "@/lib/flights/amadeus";
import { z } from "zod";
import { FlightSearchInputSchema } from "./schemas";

export type FlightSearchInput = z.infer<typeof FlightSearchInputSchema>;

export async function searchTripFlights(input: FlightSearchInput) {
  const filters =
    input.nonStop || input.maxPrice
      ? { nonStop: input.nonStop, maxPrice: input.maxPrice }
      : undefined;

  try {
    const results = await searchFlightsMulti(
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
    if (error instanceof AmadeusRateLimitError) {
      throw new ApiError(429, error.message, { provider: "amadeus" }, "amadeus_rate_limit");
    }
    throw error;
  }
}
