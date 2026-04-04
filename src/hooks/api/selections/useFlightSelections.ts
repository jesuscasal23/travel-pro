"use client";

import { queryKeys } from "@/hooks/api/keys";
import type { FlightSelection } from "@/types";
import { createSelectionQueryHook } from "./shared";

export const useFlightSelections = createSelectionQueryHook<FlightSelection>({
  kind: "flights",
  queryKey: queryKeys.selections.flightsForTrip,
  source: "useFlightSelections",
  fallbackMessage: "Failed to load flight selections",
});
