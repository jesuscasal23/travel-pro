import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { fetchTrip } from "./shared";

export function useTrip(tripId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.trips.detail(tripId),
    queryFn: () => fetchTrip(tripId),
    enabled: options?.enabled ?? true,
  });
}
