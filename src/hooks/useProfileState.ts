import { useShallow } from "zustand/shallow";
import { useTripStore } from "@/stores/useTripStore";

/** All profile fields + their setters in a single selector. */
export function useProfileState() {
  return useTripStore(
    useShallow((s) => ({
      nationality: s.nationality,
      setNationality: s.setNationality,
      homeAirport: s.homeAirport,
      setHomeAirport: s.setHomeAirport,
      travelStyle: s.travelStyle,
      setTravelStyle: s.setTravelStyle,
      interests: s.interests,
      toggleInterest: s.toggleInterest,
      pace: s.pace,
      setPace: s.setPace,
    }))
  );
}
