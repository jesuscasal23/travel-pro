import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { fetchTrips } from "./shared";

export function useTrips() {
  const query = useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: fetchTrips,
  });
  return {
    ...query,
    trips: query.data?.trips ?? [],
    isSuperUser: query.data?.isSuperUser ?? false,
  };
}
