import { apiFetch } from "@/lib/client/api-fetch";
import type { CityRecord } from "@/types";

export async function fetchCities(): Promise<CityRecord[]> {
  const data = await apiFetch<{ cities: CityRecord[] }>("/api/v1/places/cities", {
    source: "useCities",
    fallbackMessage: "Failed to load cities",
  });
  return data.cities;
}
