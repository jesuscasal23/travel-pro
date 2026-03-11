import type { TravelStyle } from "@/types";

interface TravelStyleOption {
  id: TravelStyle;
  emoji: string;
  label: string;
  description: string;
}

export const travelStyles: TravelStyleOption[] = [
  {
    id: "backpacker",
    emoji: "🎒",
    label: "Backpacker",
    description: "Hostels, street food, local transport",
  },
  {
    id: "smart-budget",
    emoji: "⚖️",
    label: "Smart Budget",
    description: "Mid-range hotels, restaurants, tours",
  },
  {
    id: "comfort-explorer",
    emoji: "✨",
    label: "Comfort Explorer",
    description: "Boutique hotels, fine dining, experiences",
  },
  {
    id: "luxury",
    emoji: "💎",
    label: "Luxury Traveler",
    description: "5-star resorts, private experiences",
  },
];
