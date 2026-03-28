export const queryKeys = {
  auth: {
    status: ["auth", "status"] as const,
  },
  trips: {
    all: ["trips"] as const,
    list: () => [...queryKeys.trips.all, "list"] as const,
    detail: (id: string) => [...queryKeys.trips.all, "detail", id] as const,
  },
  enrichment: {
    visa: (nationality: string, routeKey: string) =>
      ["enrichment", "visa", nationality, routeKey] as const,
    weather: (routeKey: string, dateStart: string) =>
      ["enrichment", "weather", routeKey, dateStart] as const,
    accommodation: (routeKey: string, dateStart: string, travelStyle: string, travelers: number) =>
      ["enrichment", "accommodation", routeKey, dateStart, travelStyle, travelers] as const,
  },
  profile: {
    all: ["profile"] as const,
    detail: () => [...queryKeys.profile.all, "detail"] as const,
    export: () => [...queryKeys.profile.all, "export"] as const,
  },
  admin: {
    all: ["admin"] as const,
    stats: () => [...queryKeys.admin.all, "stats"] as const,
    users: {
      all: () => [...queryKeys.admin.all, "users"] as const,
      list: (page: number, limit: number, search: string) =>
        [...queryKeys.admin.users.all(), page, limit, search] as const,
    },
    trips: {
      all: () => [...queryKeys.admin.all, "trips"] as const,
      list: (page: number, limit: number, search: string) =>
        [...queryKeys.admin.trips.all(), page, limit, search] as const,
    },
  },
  bookingClicks: {
    all: ["booking-clicks"] as const,
    forTrip: (tripId: string) => [...queryKeys.bookingClicks.all, tripId] as const,
  },
  flights: {
    all: ["flights"] as const,
    trip: (tripId: string) => [...queryKeys.flights.all, tripId] as const,
    search: (
      tripId: string,
      params: {
        fromIata: string;
        toIata: string;
        departureDate: string;
        travelers: number;
        nonStop?: boolean;
        maxPrice?: number;
      }
    ) =>
      [
        ...queryKeys.flights.trip(tripId),
        "search",
        params.fromIata,
        params.toIata,
        params.departureDate,
        params.travelers,
        params.nonStop ?? false,
        params.maxPrice ?? null,
      ] as const,
  },
  selections: {
    all: ["selections"] as const,
    flightsForTrip: (tripId: string) => [...queryKeys.selections.all, "flights", tripId] as const,
    hotelsForTrip: (tripId: string) => [...queryKeys.selections.all, "hotels", tripId] as const,
    cart: () => [...queryKeys.selections.all, "cart"] as const,
    unbookedCount: () => [...queryKeys.selections.all, "unbooked-count"] as const,
  },
} as const;
