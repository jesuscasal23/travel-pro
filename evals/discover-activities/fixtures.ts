import type { UserProfile, TripIntent, CityStop } from "../../src/types";

export interface Fixture {
  profile: UserProfile;
  intent: TripIntent;
  city: CityStop;
}

export const fixtures: Record<string, Fixture> = {
  "bangkok-backpacker": {
    profile: {
      nationality: "Spanish",
      homeAirport: "MAD",
      travelStyle: "backpacker",
      interests: ["street food", "temples", "nightlife"],
      pace: "active",
    },
    intent: {
      id: "eval-bangkok",
      tripType: "single-city",
      region: "Southeast Asia",
      destination: "Bangkok",
      destinationCountry: "Thailand",
      destinationCountryCode: "TH",
      dateStart: "2026-05-01",
      dateEnd: "2026-05-05",
      travelers: 1,
    },
    city: {
      id: "bangkok",
      city: "Bangkok",
      country: "Thailand",
      lat: 13.7563,
      lng: 100.5018,
      days: 4,
      countryCode: "TH",
    },
  },

  "paris-luxury": {
    profile: {
      nationality: "French",
      homeAirport: "CDG",
      travelStyle: "luxury",
      interests: ["fine dining", "art", "wine"],
      pace: "relaxed",
    },
    intent: {
      id: "eval-paris",
      tripType: "single-city",
      region: "Western Europe",
      destination: "Paris",
      destinationCountry: "France",
      destinationCountryCode: "FR",
      dateStart: "2026-06-10",
      dateEnd: "2026-06-13",
      travelers: 2,
    },
    city: {
      id: "paris",
      city: "Paris",
      country: "France",
      lat: 48.8566,
      lng: 2.3522,
      days: 3,
      countryCode: "FR",
    },
  },

  "tokyo-family": {
    profile: {
      nationality: "American",
      homeAirport: "JFK",
      travelStyle: "comfort-explorer",
      interests: ["culture", "food", "family-friendly"],
      pace: "moderate",
    },
    intent: {
      id: "eval-tokyo",
      tripType: "single-city",
      region: "East Asia",
      destination: "Tokyo",
      destinationCountry: "Japan",
      destinationCountryCode: "JP",
      dateStart: "2026-04-01",
      dateEnd: "2026-04-06",
      travelers: 4,
    },
    city: {
      id: "tokyo",
      city: "Tokyo",
      country: "Japan",
      lat: 35.6762,
      lng: 139.6503,
      days: 5,
      countryCode: "JP",
    },
  },

  "ljubljana-small": {
    profile: {
      nationality: "German",
      homeAirport: "MUC",
      travelStyle: "backpacker",
      interests: ["nature", "history", "coffee culture"],
      pace: "moderate",
    },
    intent: {
      id: "eval-ljubljana",
      tripType: "multi-city",
      region: "Central Europe",
      destination: "Ljubljana",
      destinationCountry: "Slovenia",
      destinationCountryCode: "SI",
      dateStart: "2026-07-15",
      dateEnd: "2026-07-17",
      travelers: 1,
    },
    city: {
      id: "ljubljana",
      city: "Ljubljana",
      country: "Slovenia",
      lat: 46.0569,
      lng: 14.5058,
      days: 2,
      countryCode: "SI",
    },
  },

  "berlin-nightlife": {
    profile: {
      nationality: "British",
      homeAirport: "LHR",
      travelStyle: "backpacker",
      interests: ["clubs", "bars", "live music", "cocktails"],
      pace: "active",
    },
    intent: {
      id: "eval-berlin",
      tripType: "single-city",
      region: "Central Europe",
      destination: "Berlin",
      destinationCountry: "Germany",
      destinationCountryCode: "DE",
      dateStart: "2026-08-01",
      dateEnd: "2026-08-04",
      travelers: 2,
    },
    city: {
      id: "berlin",
      city: "Berlin",
      country: "Germany",
      lat: 52.52,
      lng: 13.405,
      days: 3,
      countryCode: "DE",
    },
  },

  "queenstown-adventure": {
    profile: {
      nationality: "Australian",
      homeAirport: "SYD",
      travelStyle: "backpacker",
      interests: ["hiking", "diving", "kayaking", "climbing"],
      pace: "active",
    },
    intent: {
      id: "eval-queenstown",
      tripType: "single-city",
      region: "Oceania",
      destination: "Queenstown",
      destinationCountry: "New Zealand",
      destinationCountryCode: "NZ",
      dateStart: "2026-01-10",
      dateEnd: "2026-01-14",
      travelers: 1,
    },
    city: {
      id: "queenstown",
      city: "Queenstown",
      country: "New Zealand",
      lat: -45.0312,
      lng: 168.6626,
      days: 4,
      countryCode: "NZ",
    },
  },
};
