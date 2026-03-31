import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SelectedCity {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  iataCode?: string;
}

export type DateMode = "exact" | "flexible";

interface PlanFormState {
  planStep: number;
  selectedCities: SelectedCity[];
  tripDescription: string;
  planningPriorities: string[];
  dateStart: string;
  dateEnd: string;
  dateMode: DateMode;
  dayCount: number;
  travelers: number;
}

interface PlanFormActions {
  setPlanStep: (step: number) => void;
  addCity: (city: SelectedCity) => void;
  removeCity: (index: number) => void;
  reorderCities: (cities: SelectedCity[]) => void;
  updateCityIata: (index: number, iataCode: string) => void;
  setTripDescription: (description: string) => void;
  setPlanningPriorities: (priorities: string[]) => void;
  togglePlanningPriority: (priority: string) => void;
  setDateStart: (date: string) => void;
  setDateEnd: (date: string) => void;
  setDateMode: (mode: DateMode) => void;
  setDayCount: (count: number) => void;
  setTravelers: (count: number) => void;
  resetPlanForm: () => void;
}

const initialPlanFormState: PlanFormState = {
  planStep: 1,
  selectedCities: [],
  tripDescription: "",
  planningPriorities: [],
  dateStart: "",
  dateEnd: "",
  dateMode: "exact",
  dayCount: 7,
  travelers: 2,
};

export const usePlanFormStore = create<PlanFormState & PlanFormActions>()(
  persist(
    (set) => ({
      ...initialPlanFormState,

      setPlanStep: (step) => set({ planStep: step }),
      addCity: (city) =>
        set((state) => ({
          selectedCities: [...state.selectedCities, city],
        })),
      removeCity: (index) =>
        set((state) => ({
          selectedCities: state.selectedCities.filter((_, i) => i !== index),
        })),
      reorderCities: (cities) => set({ selectedCities: cities }),
      updateCityIata: (index, iataCode) =>
        set((state) => ({
          selectedCities: state.selectedCities.map((c, i) =>
            i === index ? { ...c, iataCode } : c
          ),
        })),
      setTripDescription: (tripDescription) => set({ tripDescription }),
      setPlanningPriorities: (planningPriorities) =>
        set({ planningPriorities: normalizePlanningPriorities(planningPriorities) }),
      togglePlanningPriority: (priority) =>
        set((state) => ({
          planningPriorities: state.planningPriorities.includes(priority)
            ? state.planningPriorities.filter((p) => p !== priority)
            : [...state.planningPriorities, priority],
        })),
      setDateStart: (date) => set({ dateStart: date }),
      setDateEnd: (date) => set({ dateEnd: date }),
      setDateMode: (dateMode) => set({ dateMode }),
      setDayCount: (dayCount) => set({ dayCount }),
      setTravelers: (count) => set({ travelers: count }),
      resetPlanForm: () => set(initialPlanFormState),
    }),
    {
      name: "travel-pro-plan-form",
      merge: (persistedState, currentState) => {
        const typed = persistedState as Partial<PlanFormState> & {
          planningPriority?: string;
          planningPriorities?: string[] | string;
        };
        return {
          ...currentState,
          ...typed,
          selectedCities: Array.isArray(typed.selectedCities) ? typed.selectedCities : [],
          planningPriorities: normalizePlanningPriorities(
            typed.planningPriorities ?? typed.planningPriority
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
