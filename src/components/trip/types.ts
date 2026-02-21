import type { Itinerary } from "@/types";

export type MobileTab = "journey" | "prep" | "money";
export type DesktopTab = "journey" | "prep" | "spending" | "route";

export interface TripLayoutProps {
  itinerary: Itinerary;
  tripId: string;
  tripTitle: string;
  totalDays: number;
  countries: string[];
  isAuthenticated: boolean | null;
  isPartialItinerary: boolean;
  isGenerating: boolean;
  generationError: string | null;
  needsRegeneration: boolean;
  onRetry: () => void;
  onRegenerate: () => void;
  onDismissRegeneration: () => void;
  visaLoading: boolean;
  weatherLoading: boolean;
  visaError: boolean;
  weatherError: boolean;
  generatingCityId: string | null;
  onGenerateActivities: (cityId: string, cityName: string) => void;
}

export interface DesktopLayoutProps extends TripLayoutProps {
  activeCityIndex: number | null;
  onCityClick: (index: number) => void;
}
