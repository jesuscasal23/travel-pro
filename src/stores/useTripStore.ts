import { create } from "zustand";
import type { TravelStyle, ActivityPace } from "@/types";
import { normalizeInterest, normalizeInterests } from "@/lib/features/profile/interests";

interface TripStoreState {
  // Profile inputs — transient (not persisted).
  // Authenticated users always get these from the server via React Query.
  // Guest users write here during onboarding; cleared on sign-out.
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle | null;
  interests: string[];
  pace: ActivityPace | null;

  // Transient itinerary build UI state
  isGenerating: boolean; // true while the /generate stream is in flight
  needsRegeneration: boolean; // true when the user edits the route and activities are stale
}

interface TripStoreActions {
  setNationality: (nationality: string) => void;
  setHomeAirport: (airport: string) => void;
  setTravelStyle: (style: TravelStyle) => void;
  setInterests: (interests: string[]) => void;
  toggleInterest: (interest: string) => void;
  setPace: (pace: ActivityPace) => void;
  setIsGenerating: (generating: boolean) => void;
  setNeedsRegeneration: (needs: boolean) => void;
  // Clears all profile state on sign-out
  resetAll: () => void;
}

const initialState: TripStoreState = {
  nationality: "",
  homeAirport: "",
  travelStyle: null,
  interests: [],
  pace: null,
  isGenerating: false,
  needsRegeneration: false,
};

export const useTripStore = create<TripStoreState & TripStoreActions>()((set) => ({
  ...initialState,

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

  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setNeedsRegeneration: (needs) => set({ needsRegeneration: needs }),

  resetAll: () => set(initialState),
}));
