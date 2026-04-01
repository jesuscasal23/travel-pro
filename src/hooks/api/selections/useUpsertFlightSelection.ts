"use client";

import { queryKeys } from "@/hooks/api/keys";
import { useUpsertSelection } from "./useUpsertSelection";
import type { FlightSelection } from "@/types";

export function useUpsertFlightSelection() {
  return useUpsertSelection<FlightSelection>("flights", queryKeys.selections.flightsForTrip);
}
