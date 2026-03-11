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
    accommodation: (routeKey: string, dateStart: string, travelStyle: string) =>
      ["enrichment", "accommodation", routeKey, dateStart, travelStyle] as const,
  },
  profile: {
    all: ["profile"] as const,
    detail: () => [...queryKeys.profile.all, "detail"] as const,
    export: () => [...queryKeys.profile.all, "export"] as const,
  },
  routeSelection: {
    all: ["route-selection"] as const,
    byParams: (key: string) => [...queryKeys.routeSelection.all, key] as const,
  },
} as const;
