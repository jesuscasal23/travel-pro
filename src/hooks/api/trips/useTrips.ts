import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { fetchTrips } from "./shared";

export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: fetchTrips,
  });
}
