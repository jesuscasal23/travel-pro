import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TravelStyle, TripType, Itinerary, ActivityPace } from "@/types";

interface TripStoreState {
  // Profile inputs reused across planner and profile screen
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];
  pace: ActivityPace;

  // Quick Plan questionnaire
  planStep: number;
  tripType: TripType;
  tripDescription: string;
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
  toggleInterest: (interest: string) => void;
  setPace: (pace: ActivityPace) => void;

  // Quick Plan
  setPlanStep: (step: number) => void;
  setTripType: (tripType: TripType) => void;
  setTripDescription: (description: string) => void;
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
}

const initialPlanState = {
  planStep: 1,
  tripType: "single-city" as TripType,
  tripDescription: "",
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
      travelStyle: "comfort",
      interests: [],
      pace: "moderate" as ActivityPace,
      // Plan defaults
      ...initialPlanState,

      // Profile actions
      setNationality: (nationality) => set({ nationality }),
      setHomeAirport: (airport) => set({ homeAirport: airport }),
      setTravelStyle: (style) => set({ travelStyle: style }),
      setPace: (pace) => set({ pace }),
      toggleInterest: (interest) =>
        set((state) => ({
          interests: state.interests.includes(interest)
            ? state.interests.filter((i) => i !== interest)
            : [...state.interests, interest],
        })),

      // Plan actions
      setPlanStep: (step) => set({ planStep: step }),
      setTripType: (tripType) => set({ tripType }),
      setTripDescription: (description) => set({ tripDescription: description }),
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
        tripType: state.tripType,
        tripDescription: state.tripDescription,
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
    }
  )
);
