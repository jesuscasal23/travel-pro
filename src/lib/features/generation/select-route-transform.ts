import { z } from "zod";
import { SelectRouteInputSchema } from "./schemas";

export type SelectRouteInput = z.infer<typeof SelectRouteInputSchema>;

export function buildSingleCitySelection(tripIntent: SelectRouteInput["tripIntent"]) {
  if (tripIntent.tripType !== "single-city" || !tripIntent.destination) {
    return null;
  }

  const durationDays = Math.max(
    1,
    Math.round(
      (new Date(tripIntent.dateEnd).getTime() - new Date(tripIntent.dateStart).getTime()) / 86400000
    )
  );

  return [
    {
      id: tripIntent.destination.toLowerCase().replace(/\s+/g, "-"),
      city: tripIntent.destination,
      country: tripIntent.destinationCountry ?? "",
      countryCode: tripIntent.destinationCountryCode ?? "",
      iataCode: "",
      lat: tripIntent.destinationLat ?? 0,
      lng: tripIntent.destinationLng ?? 0,
      minDays: durationDays,
      maxDays: durationDays,
    },
  ];
}
