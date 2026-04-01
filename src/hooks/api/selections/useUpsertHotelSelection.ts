"use client";

import { queryKeys } from "@/hooks/api/keys";
import { useUpsertSelection } from "./useUpsertSelection";
import type { HotelSelection } from "@/types";

export function useUpsertHotelSelection() {
  return useUpsertSelection<HotelSelection>("hotels", queryKeys.selections.hotelsForTrip);
}
