"use client";

import { queryKeys } from "@/hooks/api/keys";
import type { HotelSelection } from "@/types";
import { createSelectionQueryHook } from "./shared";

export const useHotelSelections = createSelectionQueryHook<HotelSelection>({
  kind: "hotels",
  queryKey: queryKeys.selections.hotelsForTrip,
  source: "useHotelSelections",
  fallbackMessage: "Failed to load hotel selections",
});
