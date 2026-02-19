import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TravelStyle, TripVibe, TripType, Itinerary } from "@/types";

interface TripStoreState {
  // Onboarding
  onboardingStep: number;
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];

  // Quick Plan questionnaire
  planStep: number;
  tripType: TripType;
  region: string;
  destination: string;
  destinationCountry: string;
  destinationCountryCode: string;
  destinationLat: number;
  destinationLng: number;
  dateStart: string;
  dateEnd: string;
  flexibleDates: boolean;
  budget: number;
  vibe: TripVibe;
  travelers: number;

  // Generation
  isGenerating: boolean;
  generationStep: number;

  // Result
  currentTripId: string;
  itinerary: Itinerary | null;

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
  setTripType: (tripType: TripType) => void;
  setRegion: (region: string) => void;
  setDestination: (city: string, country: string, countryCode: string, lat: number, lng: number) => void;
  clearDestination: () => void;
  setDateStart: (date: string) => void;
  setDateEnd: (date: string) => void;
  setFlexibleDates: (flexible: boolean) => void;
  setBudget: (budget: number) => void;
  setVibe: (vibe: TripVibe) => void;
  setTravelers: (count: number) => void;

  // Generation
  setIsGenerating: (generating: boolean) => void;
  setGenerationStep: (step: number) => void;

  // Result
  setCurrentTripId: (id: string) => void;
  setItinerary: (itinerary: Itinerary | null) => void;

  // Display
  setDisplayName: (name: string) => void;

  // Reset
  resetPlan: () => void;
}

const initialPlanState = {
  planStep: 1,
  tripType: "multi-city" as TripType,
  region: "",
  destination: "",
  destinationCountry: "",
  destinationCountryCode: "",
  destinationLat: 0,
  destinationLng: 0,
  dateStart: "",
  dateEnd: "",
  flexibleDates: false,
  budget: 10000,
  vibe: "mix" as TripVibe,
  travelers: 2,
  isGenerating: false,
  generationStep: 0,
  currentTripId: "",
  itinerary: null,
};

export const useTripStore = create<TripStoreState & TripStoreActions>()(
  persist(
    (set) => ({
      // Onboarding defaults
      onboardingStep: 1,
      nationality: "",
      homeAirport: "",
      travelStyle: "comfort",
      interests: [],
      displayName: "",

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
      setTripType: (tripType) => set({ tripType }),
      setRegion: (region) => set({ region }),
      setDestination: (city, country, countryCode, lat, lng) =>
        set({ destination: city, destinationCountry: country, destinationCountryCode: countryCode, destinationLat: lat, destinationLng: lng }),
      clearDestination: () =>
        set({ destination: "", destinationCountry: "", destinationCountryCode: "", destinationLat: 0, destinationLng: 0 }),
      setDateStart: (date) => set({ dateStart: date }),
      setDateEnd: (date) => set({ dateEnd: date }),
      setFlexibleDates: (flexible) => set({ flexibleDates: flexible }),
      setBudget: (budget) => set({ budget }),
      setVibe: (vibe) => set({ vibe }),
      setTravelers: (count) => set({ travelers: count }),

      // Generation actions
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setGenerationStep: (step) => set({ generationStep: step }),

      // Result actions
      setCurrentTripId: (id) => set({ currentTripId: id }),
      setItinerary: (itinerary) => set({ itinerary }),

      // Display
      setDisplayName: (name) => set({ displayName: name }),

      // Reset plan to defaults
      resetPlan: () => set(initialPlanState),
    }),
    {
      name: "travel-pro-store",
      // Explicitly whitelist what gets written to localStorage.
      // Transient UI state (isGenerating, generationStep, planStep) is excluded —
      // it doesn't need to survive a page refresh and pollutes the stored payload.
      // Note: itinerary is retained so the trip view survives a refresh without
      // a DB round-trip. In a production multi-user build, move this to a
      // server-side session or re-fetch from Supabase by currentTripId.
      partialize: (state) => ({
        onboardingStep: state.onboardingStep,
        nationality: state.nationality,
        homeAirport: state.homeAirport,
        travelStyle: state.travelStyle,
        interests: state.interests,
        displayName: state.displayName,
        tripType: state.tripType,
        region: state.region,
        destination: state.destination,
        destinationCountry: state.destinationCountry,
        destinationCountryCode: state.destinationCountryCode,
        destinationLat: state.destinationLat,
        destinationLng: state.destinationLng,
        dateStart: state.dateStart,
        dateEnd: state.dateEnd,
        flexibleDates: state.flexibleDates,
        budget: state.budget,
        vibe: state.vibe,
        travelers: state.travelers,
        currentTripId: state.currentTripId,
        itinerary: state.itinerary,
      }),
    }
  )
);
