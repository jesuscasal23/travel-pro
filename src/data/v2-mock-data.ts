import type { DepartureTask } from "@/types";

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
