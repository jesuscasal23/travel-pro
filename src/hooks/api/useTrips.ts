import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { parseApiErrorResponse, reportApiError } from "@/lib/client/api-error-reporting";
import type { TripSummary } from "@/types";

async function fetchTrips(): Promise<TripSummary[]> {
  const endpoint = "/api/v1/trips";
  let res: Response;
  try {
    res = await fetch(endpoint);
  } catch (error) {
    await reportApiError({
      source: "useTrips",
      endpoint,
      method: "GET",
      message: error instanceof Error ? error.message : "Network error while loading trips",
    });
    throw new Error("Failed to load trips");
  }
  if (!res.ok) {
    const parsed = await parseApiErrorResponse(res, "Failed to load trips");
    await reportApiError({
      source: "useTrips",
      endpoint,
      method: "GET",
      message: parsed.message,
      status: parsed.status,
      requestId: parsed.requestId,
      responseBody: parsed.responseBody,
    });
    throw new Error(parsed.message);
  }
  const data = await res.json();
  return data.trips ?? [];
}

export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: fetchTrips,
  });
}
