import type { TravelStyle } from "@/types";

export interface TravelStyleOption {
  id: TravelStyle;
  emoji: string;
  label: string;
  description: string;
}

export const travelStyles: TravelStyleOption[] = [
  { id: "backpacker", emoji: "🎒", label: "Backpacker", description: "Hostels, street food, maximum adventure" },
  { id: "comfort", emoji: "🛏️", label: "Comfort", description: "3\u20134 star hotels, mix of local and known restaurants" },
  { id: "luxury", emoji: "✨", label: "Luxury", description: "5-star properties, fine dining, premium experiences" },
];
