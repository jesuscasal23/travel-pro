export const queryKeys = {
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
  },
  profile: {
    all: ["profile"] as const,
    export: () => [...queryKeys.profile.all, "export"] as const,
  },
  routeSelection: {
    all: ["route-selection"] as const,
    byParams: (key: string) => [...queryKeys.routeSelection.all, key] as const,
  },
} as const;
