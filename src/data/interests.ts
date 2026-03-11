import type { InterestOption } from "@/types";

export const interestOptions: InterestOption[] = [
  { id: "surfing", label: "Surfing", emoji: "🏄" },
  { id: "food", label: "Food", emoji: "🍽️" },
  { id: "culture", label: "Culture", emoji: "🌍" },
  { id: "hiking", label: "Hiking", emoji: "🥾" },
  { id: "nightlife", label: "Nightlife", emoji: "🎵" },
  { id: "relaxation", label: "Relaxation", emoji: "☕" },
  { id: "nature", label: "Nature", emoji: "🌤️" },
  { id: "photography", label: "Photography", emoji: "📷" },
];

export const interestOptionsById = new Map(interestOptions.map((option) => [option.id, option]));
