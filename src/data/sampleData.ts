import type { Region } from "@/types";

export const regions: Region[] = [
  {
    id: "southeast-asia",
    name: "Southeast Asia",
    countries: "Thailand, Vietnam, Cambodia, Indonesia, Philippines",
    popular: true,
  },
  {
    id: "east-asia",
    name: "East Asia",
    countries: "Japan, South Korea, Taiwan, China",
    popular: true,
  },
  { id: "south-asia", name: "South Asia", countries: "India, Sri Lanka, Nepal" },
  {
    id: "europe",
    name: "Europe",
    countries: "Spain, Italy, France, Greece, Portugal",
    popular: true,
  },
  { id: "south-america", name: "South America", countries: "Colombia, Peru, Argentina, Brazil" },
  { id: "central-america", name: "Central America", countries: "Mexico, Costa Rica, Guatemala" },
  { id: "africa", name: "Africa", countries: "Morocco, South Africa, Kenya, Tanzania" },
];
