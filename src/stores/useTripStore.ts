import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TravelStyle, TripType, Itinerary, ActivityPace } from "@/types";
import { normalizeInterest, normalizeInterests } from "@/lib/profile/interests";

interface TripStoreState {
  // Profile inputs reused across planner and profile screen
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];
  pace: ActivityPace;
  vibeAdventureComfort: number;
  vibeSocialQuiet: number;
  vibeLuxuryBudget: number;
  vibeStructuredSpontaneous: number;
  vibeWarmMixed: number;

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
  setVibeValue: (
    key:
      | "vibeAdventureComfort"
      | "vibeSocialQuiet"
      | "vibeLuxuryBudget"
      | "vibeStructuredSpontaneous"
      | "vibeWarmMixed",
    value: number
  ) => void;

  // Quick Plan
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
      travelStyle: "smart-budget",
      interests: [],
      pace: "moderate" as ActivityPace,
      vibeAdventureComfort: 50,
      vibeSocialQuiet: 50,
      vibeLuxuryBudget: 50,
      vibeStructuredSpontaneous: 50,
      vibeWarmMixed: 50,
      // Plan defaults
      ...initialPlanState,

      // Profile actions
      setNationality: (nationality) => set({ nationality }),
      setHomeAirport: (airport) => set({ homeAirport: airport }),
      setTravelStyle: (style) => set({ travelStyle: style }),
      setInterests: (interests) => set({ interests: normalizeInterests(interests) }),
      setPace: (pace) => set({ pace }),
      setVibeValue: (key, value) =>
        set({
          [key]: Math.max(0, Math.min(100, value)),
        } as Pick<TripStoreState, typeof key>),
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
      setTripDescription: (description) => set({ tripDescription: description }),
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
          travelStyle: "smart-budget",
          interests: [],
          pace: "moderate" as ActivityPace,
          vibeAdventureComfort: 50,
          vibeSocialQuiet: 50,
          vibeLuxuryBudget: 50,
          vibeStructuredSpontaneous: 50,
          vibeWarmMixed: 50,
          ...initialPlanState,
        }),
    }),
    {
      name: "travel-pro-store",
      // Explicitly whitelist what gets written to localStorage.
      // Transient UI state (isGenerating, planStep) is excluded —
      // it doesn't need to survive a page refresh and pollutes the stored payload.
      // Note: itinerary is retained so the trip view survives a refresh without
      // a DB round-trip. In a production multi-user build, move this to a
      // server-side session or re-fetch from Supabase by currentTripId.
      partialize: (state) => ({
        nationality: state.nationality,
        homeAirport: state.homeAirport,
        travelStyle: state.travelStyle,
        interests: state.interests,
        pace: state.pace,
        vibeAdventureComfort: state.vibeAdventureComfort,
        vibeSocialQuiet: state.vibeSocialQuiet,
        vibeLuxuryBudget: state.vibeLuxuryBudget,
        vibeStructuredSpontaneous: state.vibeStructuredSpontaneous,
        vibeWarmMixed: state.vibeWarmMixed,
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
        currentTripId: state.currentTripId,
        itinerary: state.itinerary,
      }),
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<TripStoreState> & {
          planningPriority?: string;
          planningPriorities?: string[] | string;
        };
        return {
          ...currentState,
          ...typedState,
          interests: normalizeInterests(typedState.interests ?? currentState.interests),
          planningPriorities: normalizePlanningPriorities(
            typedState.planningPriorities ?? typedState.planningPriority
          ),
          vibeAdventureComfort:
            typedState.vibeAdventureComfort ?? currentState.vibeAdventureComfort,
          vibeSocialQuiet: typedState.vibeSocialQuiet ?? currentState.vibeSocialQuiet,
          vibeLuxuryBudget: typedState.vibeLuxuryBudget ?? currentState.vibeLuxuryBudget,
          vibeStructuredSpontaneous:
            typedState.vibeStructuredSpontaneous ?? currentState.vibeStructuredSpontaneous,
          vibeWarmMixed: typedState.vibeWarmMixed ?? currentState.vibeWarmMixed,
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
});
