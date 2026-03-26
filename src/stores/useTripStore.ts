import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TravelStyle, TripType, Itinerary, ActivityPace } from "@/types";
import { normalizeInterest, normalizeInterests } from "@/lib/features/profile/interests";

interface TripStoreState {
  // Profile inputs reused across planner and profile screen
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle | null;
  interests: string[];
  pace: ActivityPace | null;

  // Quick Plan questionnaire
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

  // Generation
  isGenerating: boolean;
  needsRegeneration: boolean;

  // Result
  currentTripId: string;
  itinerary: Itinerary | null;
}

interface TripStoreActions {
  // Profile
  setNationality: (nationality: string) => void;
  setHomeAirport: (airport: string) => void;
  setTravelStyle: (style: TravelStyle) => void;
  setInterests: (interests: string[]) => void;
  toggleInterest: (interest: string) => void;
  setPace: (pace: ActivityPace) => void;

  // Quick Plan
  setPlanStep: (step: number) => void;
  setTripType: (tripType: TripType) => void;
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

  // Generation
  setIsGenerating: (generating: boolean) => void;
  setNeedsRegeneration: (needs: boolean) => void;

  // Result
  setCurrentTripId: (id: string) => void;
  setItinerary: (itinerary: Itinerary | null) => void;

  // Reset
  resetPlan: () => void;
  resetAll: () => void;
}

const initialPlanState = {
  planStep: 1,
  tripType: "single-city" as TripType,
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
  isGenerating: false,
  needsRegeneration: false,
  currentTripId: "",
  itinerary: null,
};

export const useTripStore = create<TripStoreState & TripStoreActions>()(
  persist(
    (set) => ({
      // Profile defaults
      nationality: "",
      homeAirport: "",
      travelStyle: null,
      interests: [],
      pace: null,
      // Plan defaults
      ...initialPlanState,

      // Profile actions
      setNationality: (nationality) => set({ nationality }),
      setHomeAirport: (airport) => set({ homeAirport: airport }),
      setTravelStyle: (style) => set({ travelStyle: style }),
      setInterests: (interests) => set({ interests: normalizeInterests(interests) }),
      setPace: (pace) => set({ pace }),
      toggleInterest: (interest) =>
        set((state) => {
          const normalized = normalizeInterest(interest);
          if (!normalized) return state;

          return {
            interests: state.interests.includes(normalized)
              ? state.interests.filter((i) => i !== normalized)
              : [...state.interests, normalized],
          };
        }),

      // Plan actions
      setPlanStep: (step) => set({ planStep: step }),
      setTripType: (tripType) => set({ tripType }),
      setPlanningPriorities: (planningPriorities) =>
        set({ planningPriorities: normalizePlanningPriorities(planningPriorities) }),
      togglePlanningPriority: (planningPriority) =>
        set((state) => ({
          planningPriorities: state.planningPriorities.includes(planningPriority)
            ? state.planningPriorities.filter((priority) => priority !== planningPriority)
            : [...state.planningPriorities, planningPriority],
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

      // Generation actions
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setNeedsRegeneration: (needs) => set({ needsRegeneration: needs }),

      // Result actions
      setCurrentTripId: (id) => set({ currentTripId: id }),
      setItinerary: (itinerary) => set({ itinerary }),

      // Reset plan to defaults
      resetPlan: () => set(initialPlanState),
      // Full reset on sign-out — clears profile + plan + results
      resetAll: () =>
        set({
          nationality: "",
          homeAirport: "",
          travelStyle: null,
          interests: [],
          pace: null,
          ...initialPlanState,
        }),
    }),
    {
      name: "travel-pro-store",
      // Only persist plan form fields — these survive the signup redirect so
      // a guest who fills the planner doesn't have to re-enter destination/dates
      // after creating an account. Profile fields (nationality, homeAirport, etc.)
      // are NOT persisted: logged-in users always get them from the server.
      partialize: (state) => ({
        tripType: state.tripType,
        tripDescription: state.tripDescription,
        planningPriorities: state.planningPriorities,
        region: state.region,
        destination: state.destination,
        destinationCountry: state.destinationCountry,
        destinationCountryCode: state.destinationCountryCode,
        destinationLat: state.destinationLat,
        destinationLng: state.destinationLng,
        dateStart: state.dateStart,
        dateEnd: state.dateEnd,
        travelers: state.travelers,
      }),
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<TripStoreState> & {
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

  return Array.from(new Set(priorities.map((priority) => priority.trim()).filter(Boolean)));
}

/**
 * Resolves once the persisted Zustand store has finished hydrating from
 * localStorage.  Components that depend on persisted state (e.g. itinerary)
 * can `use()` this or `await` it to avoid a flash of default/empty state.
 */
export const storeHydrationPromise = new Promise<void>((resolve) => {
  // During SSR / static build there is no persist middleware — resolve immediately.
  if (typeof window === "undefined") {
    resolve();
    return;
  }
  // If already hydrated, resolve immediately.
  try {
    if (
      (useTripStore as unknown as { persist: { hasHydrated: () => boolean } }).persist.hasHydrated()
    ) {
      resolve();
      return;
    }
  } catch {
    // persist middleware not yet initialized — fall through to listener
  }
  const unsub = useTripStore.persist.onFinishHydration(() => {
    unsub();
    resolve();
  });
  // Safety net: if onFinishHydration never fires (e.g. store already hydrated
  // before the listener was registered in some bundler configurations), resolve
  // after a short timeout so components don't spin indefinitely.
  setTimeout(() => {
    unsub();
    resolve();
  }, 500);
});
