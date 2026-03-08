import type { NextTripCard, DepartureTask } from "@/types/v2";

export const mockUserName = "Alex";

export const mockNextTrip: NextTripCard = {
  id: "mock-trip-1",
  title: "Japan Spring Trip",
  daysAway: 14,
  imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
  weather: { temp: 18, condition: "Sunny" },
  visaStatus: "ok",
  flightStatus: "booked",
  budgetStatus: "on-track",
};

export const mockDepartureTasks: DepartureTask[] = [
  {
    id: "task-1",
    title: "Complete Packing List",
    subtitle: "12 items remaining",
    type: "packing",
  },
  {
    id: "task-2",
    title: "Check-in Opens Soon",
    subtitle: "Flight JL005 to Tokyo",
    type: "checkin",
  },
];

export const mockSummary = {
  travelProfile: "Explorer Traveler",
  budget: "Balanced",
  destinations: "Southeast Asia",
  tripLength: "1-2 weeks",
};

export const interestOptions = [
  "Surfing",
  "Food",
  "Culture",
  "Hiking",
  "Nightlife",
  "Relaxation",
  "Nature",
  "Photography",
];

export const painPointOptions = [
  "Visa confusion",
  "Finding the right places to stay",
  "Building the itinerary",
  "Managing travel budget",
  "Flights and connections",
  "Packing and logistics",
  "Too many tabs and websites",
];

export const budgetTiers = [
  {
    id: "backpacker" as const,
    label: "Backpacker",
    range: "$20-40/day",
    description: "Hostels, street food, local transport",
    color: "text-v2-green",
    iconBg: "bg-green-50",
    iconColor: "text-v2-green",
  },
  {
    id: "smart-budget" as const,
    label: "Smart Budget",
    range: "$50-100/day",
    description: "Mid-range hotels, restaurants, tours",
    color: "text-v2-blue",
    iconBg: "bg-blue-50",
    iconColor: "text-v2-blue",
  },
  {
    id: "comfort" as const,
    label: "Comfort Explorer",
    range: "$150-300/day",
    description: "Boutique hotels, fine dining, experiences",
    color: "text-v2-purple",
    iconBg: "bg-purple-50",
    iconColor: "text-v2-purple",
  },
  {
    id: "luxury" as const,
    label: "Luxury Traveler",
    range: "$300+/day",
    description: "5-star resorts, private experiences",
    color: "text-v2-red",
    iconBg: "bg-red-50",
    iconColor: "text-v2-red",
  },
];
