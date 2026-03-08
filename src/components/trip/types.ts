export type MobileTab = "journey" | "prep" | "accommodation" | "flights" | "budget";
export type DesktopTab = "journey" | "prep" | "route" | "accommodation" | "flights" | "budget";

export interface DesktopLayoutProps {
  activeCityIndex: number | null;
  onCityClick: (index: number) => void;
}
