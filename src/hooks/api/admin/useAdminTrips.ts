import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { fetchAdminTrips, type AdminListParams, shouldRetry } from "./shared";

export function useAdminTrips(params: AdminListParams) {
  return useQuery({
    queryKey: queryKeys.admin.trips.list(params.page, params.limit, params.search),
    queryFn: () => fetchAdminTrips(params),
    enabled: params.enabled ?? true,
    retry: (failureCount, error) => shouldRetry(failureCount, error),
    placeholderData: keepPreviousData,
  });
}
