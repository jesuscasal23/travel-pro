import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { useAuthStatus } from "../auth/useAuthStatus";
import { fetchTrips } from "./shared";

export function useTrips() {
  const isAuthenticated = useAuthStatus();
  const query = useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: fetchTrips,
    enabled: isAuthenticated === true,
  });
  return {
    ...query,
    trips: query.data?.trips ?? [],
    isSuperUser: query.data?.isSuperUser ?? false,
  };
}
