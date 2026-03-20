import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { fetchAdminUsers, type AdminListParams, shouldRetry } from "./shared";

export function useAdminUsers(params: AdminListParams) {
  return useQuery({
    queryKey: queryKeys.admin.users.list(params.page, params.limit, params.search),
    queryFn: () => fetchAdminUsers(params),
    enabled: params.enabled ?? true,
    retry: (failureCount, error) => shouldRetry(failureCount, error),
    placeholderData: keepPreviousData,
  });
}
