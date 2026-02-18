import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TravelStyle, TripVibe } from "@/types";

interface TripStoreState {
  // Onboarding
  onboardingStep: number;
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];

  // Quick Plan questionnaire
  planStep: number;
  region: string;
  dateStart: string;
  dateEnd: string;
  flexibleDates: boolean;
  budget: number;
  vibe: TripVibe;
  travelers: number;

  // Generation
  isGenerating: boolean;
  generationStep: number;

  // Display
  displayName: string;
}

interface TripStoreActions {
  // Onboarding
  setOnboardingStep: (step: number) => void;
  setNationality: (nationality: string) => void;
  setHomeAirport: (airport: string) => void;
  setTravelStyle: (style: TravelStyle) => void;
  toggleInterest: (interest: string) => void;

  // Quick Plan
  setPlanStep: (step: number) => void;
  setRegion: (region: string) => void;
  setDateStart: (date: string) => void;
  setDateEnd: (date: string) => void;
  setFlexibleDates: (flexible: boolean) => void;
  setBudget: (budget: number) => void;
  setVibe: (vibe: TripVibe) => void;
  setTravelers: (count: number) => void;

  // Generation
  setIsGenerating: (generating: boolean) => void;
  setGenerationStep: (step: number) => void;

  // Display
  setDisplayName: (name: string) => void;

  // Reset
  resetPlan: () => void;
}

const initialPlanState = {
  planStep: 1,
  region: "",
  dateStart: "",
  dateEnd: "",
  flexibleDates: false,
  budget: 10000,
  vibe: "mix" as TripVibe,
  travelers: 2,
  isGenerating: false,
  generationStep: 0,
};

export const useTripStore = create<TripStoreState & TripStoreActions>()(
  persist(
    (set) => ({
      // Onboarding defaults
      onboardingStep: 1,
      nationality: "German",
      homeAirport: "LEJ – Leipzig/Halle",
      travelStyle: "comfort",
      interests: [],
      displayName: "Thomas",

      // Plan defaults
      ...initialPlanState,

      // Onboarding actions
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      setNationality: (nationality) => set({ nationality }),
      setHomeAirport: (airport) => set({ homeAirport: airport }),
      setTravelStyle: (style) => set({ travelStyle: style }),
      toggleInterest: (interest) =>
        set((state) => ({
          interests: state.interests.includes(interest)
            ? state.interests.filter((i) => i !== interest)
            : [...state.interests, interest],
        })),

      // Plan actions
      setPlanStep: (step) => set({ planStep: step }),
      setRegion: (region) => set({ region }),
      setDateStart: (date) => set({ dateStart: date }),
      setDateEnd: (date) => set({ dateEnd: date }),
      setFlexibleDates: (flexible) => set({ flexibleDates: flexible }),
      setBudget: (budget) => set({ budget }),
      setVibe: (vibe) => set({ vibe }),
      setTravelers: (count) => set({ travelers: count }),

      // Generation actions
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setGenerationStep: (step) => set({ generationStep: step }),

      // Display
      setDisplayName: (name) => set({ displayName: name }),

      // Reset plan to defaults
      resetPlan: () => set(initialPlanState),
    }),
    {
      name: "travel-pro-store",
    }
  )
);
