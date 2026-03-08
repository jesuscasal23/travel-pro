"use client";

import { useEditStore } from "@/stores/useEditStore";
import { useTripStore } from "@/stores/useTripStore";
import { recalculateTravelDays } from "@/lib/utils/recalculate-travel-days";
import type { Itinerary, CityStop } from "@/types";

export function useTripEdit(itinerary: Itinerary, tripId: string, isAuthenticated: boolean | null) {
  const {
    isEditMode,
    draft,
    undoStack,
    isRouteSheetOpen,
    enterEditMode,
    exitEditMode,
    saveAndExit,
    updateDraft,
    undo,
    setRouteSheetOpen,
  } = useEditStore();

  const setItinerary = useTripStore((s) => s.setItinerary);
  const setNeedsRegeneration = useTripStore((s) => s.setNeedsRegeneration);

  function handleEnterEdit(overrideTab?: () => void) {
    enterEditMode(itinerary);
    overrideTab?.();
  }

  function handleDiscard() {
    exitEditMode();
  }

  function handleSave() {
    if (!draft) return;
    saveAndExit((saved) => {
      const routeChanged =
        JSON.stringify(saved.route.map((c) => ({ id: c.id, days: c.days }))) !==
        JSON.stringify(itinerary.route.map((c) => ({ id: c.id, days: c.days })));

      const citiesAddedOrRemoved =
        saved.route.length !== itinerary.route.length ||
        saved.route.some((c, i) => c.id !== itinerary.route[i]?.id);

      let finalItinerary = saved;
      if (routeChanged) {
        finalItinerary = {
          ...saved,
          days: recalculateTravelDays(saved.days, saved.route),
        };
      }

      setItinerary(finalItinerary);

      if (citiesAddedOrRemoved) {
        setNeedsRegeneration(true);
      }

      if (isAuthenticated && tripId !== "guest") {
        fetch(`/api/v1/trips/${tripId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itinerary: finalItinerary }),
        }).catch(() => {
          /* best-effort */
        });
      }
    });
  }

  function handleRouteCitiesChange(cities: CityStop[]) {
    updateDraft((d) => ({ ...d, route: cities }));
  }

  return {
    isEditMode,
    draft,
    undoStack,
    isRouteSheetOpen,
    undo,
    setRouteSheetOpen,
    handleEnterEdit,
    handleDiscard,
    handleSave,
    handleRouteCitiesChange,
  };
}
