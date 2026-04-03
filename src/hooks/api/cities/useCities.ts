import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { fetchCities } from "./shared";

export function useCities() {
  return useQuery({
    queryKey: queryKeys.cities.list(),
    queryFn: fetchCities,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
