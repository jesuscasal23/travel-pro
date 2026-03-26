import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TripType } from "@/types";

interface PlanFormState {
  planStep: number;
  tripType: TripType;
  tripDescription: string;
  planningPriorities: string[];
  region: string;
  destination: string;
  destinationCountry: string;
  destinationCountryCode: string;
  destinationLat: number;
  destinationLng: number;
  dateStart: string;
  dateEnd: string;
  travelers: number;
}

interface PlanFormActions {
  setPlanStep: (step: number) => void;
  setTripType: (tripType: TripType) => void;
  setTripDescription: (description: string) => void;
  setPlanningPriorities: (priorities: string[]) => void;
  togglePlanningPriority: (priority: string) => void;
  setRegion: (region: string) => void;
  setDestination: (
    city: string,
    country: string,
    countryCode: string,
    lat: number,
    lng: number
  ) => void;
  clearDestination: () => void;
  setDateStart: (date: string) => void;
  setDateEnd: (date: string) => void;
  setTravelers: (count: number) => void;
  resetPlanForm: () => void;
}

const initialPlanFormState: PlanFormState = {
  planStep: 1,
  tripType: "single-city",
  tripDescription: "",
  planningPriorities: [],
  region: "",
  destination: "",
  destinationCountry: "",
  destinationCountryCode: "",
  destinationLat: 0,
  destinationLng: 0,
  dateStart: "",
  dateEnd: "",
  travelers: 2,
};

export const usePlanFormStore = create<PlanFormState & PlanFormActions>()(
  persist(
    (set) => ({
      ...initialPlanFormState,

      setPlanStep: (step) => set({ planStep: step }),
      setTripType: (tripType) => set({ tripType }),
      setTripDescription: (tripDescription) => set({ tripDescription }),
      setPlanningPriorities: (planningPriorities) =>
        set({ planningPriorities: normalizePlanningPriorities(planningPriorities) }),
      togglePlanningPriority: (priority) =>
        set((state) => ({
          planningPriorities: state.planningPriorities.includes(priority)
            ? state.planningPriorities.filter((p) => p !== priority)
            : [...state.planningPriorities, priority],
        })),
      setRegion: (region) => set({ region }),
      setDestination: (city, country, countryCode, lat, lng) =>
        set({
          destination: city,
          destinationCountry: country,
          destinationCountryCode: countryCode,
          destinationLat: lat,
          destinationLng: lng,
        }),
      clearDestination: () =>
        set({
          destination: "",
          destinationCountry: "",
          destinationCountryCode: "",
          destinationLat: 0,
          destinationLng: 0,
        }),
      setDateStart: (date) => set({ dateStart: date }),
      setDateEnd: (date) => set({ dateEnd: date }),
      setTravelers: (count) => set({ travelers: count }),
      resetPlanForm: () => set(initialPlanFormState),
    }),
    {
      // New key — separate from the legacy "travel-pro-store" to avoid collisions
      name: "travel-pro-plan-form",
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<PlanFormState> & {
          planningPriority?: string;
          planningPriorities?: string[] | string;
        };
        return {
          ...currentState,
          ...typedState,
          planningPriorities: normalizePlanningPriorities(
            typedState.planningPriorities ?? typedState.planningPriority
          ),
        };
      },
    }
  )
);

function normalizePlanningPriorities(priorities: string[] | string | undefined): string[] {
  if (typeof priorities === "string") {
    return priorities.trim() ? [priorities] : [];
  }
  if (!Array.isArray(priorities)) {
    return [];
  }
  return Array.from(new Set(priorities.map((p) => p.trim()).filter(Boolean)));
}

/**
 * Resolves once the persisted plan form store has finished hydrating from
 * localStorage. Use this in components that depend on persisted form state
 * (e.g. the plan questionnaire) to avoid a flash of empty defaults.
 */
export const planFormHydrationPromise = new Promise<void>((resolve) => {
  if (typeof window === "undefined") {
    resolve();
    return;
  }
  try {
    if (
      (
        usePlanFormStore as unknown as { persist: { hasHydrated: () => boolean } }
      ).persist.hasHydrated()
    ) {
      resolve();
      return;
    }
  } catch {
    // persist middleware not yet initialized — fall through to listener
  }
  const unsub = usePlanFormStore.persist.onFinishHydration(() => {
    unsub();
    resolve();
  });
  setTimeout(() => {
    unsub();
    resolve();
  }, 500);
});
