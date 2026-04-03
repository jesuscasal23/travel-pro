interface PresentationStop {
  city?: string | null;
  country?: string | null;
}

interface BuildTripPresentationOptions {
  destination?: string | null;
  region?: string | null;
  route?: PresentationStop[] | null;
  fallbackLabel?: string;
  fallbackTitle?: string;
}

export interface TripPresentation {
  destinationLabel: string;
  tripTitle: string;
  cityNames: string[];
  countries: string[];
  isSingleCity: boolean;
}

function compact(values: Array<string | null | undefined>): string[] {
  return values.map((value) => value?.trim() ?? "").filter(Boolean);
}

export function buildTripPresentation({
  destination,
  region,
  route,
  fallbackLabel = "Trip",
  fallbackTitle = "Untitled Trip",
}: BuildTripPresentationOptions): TripPresentation {
  const cityNames = compact((route ?? []).map((stop) => stop.city));
  const countries = Array.from(new Set(compact((route ?? []).map((stop) => stop.country))));
  const isSingleCity = (route?.length ?? 0) === 1;

  const singleCityLabel = compact([route?.[0]?.city, route?.[0]?.country]).join(", ");
  const routeLabel = isSingleCity
    ? singleCityLabel
    : cityNames.length > 0
      ? cityNames.join(" → ")
      : "";
  const countryLabel = countries.join(", ");

  const destinationLabel = destination?.trim() || routeLabel || region?.trim() || fallbackLabel;
  const tripTitle =
    routeLabel ||
    countryLabel ||
    destination?.trim() ||
    region?.trim() ||
    fallbackTitle ||
    fallbackLabel;

  return {
    destinationLabel,
    tripTitle,
    cityNames,
    countries,
    isSingleCity,
  };
}
