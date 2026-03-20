import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { fetchAdminStats, shouldRetry } from "./shared";

export function useAdminStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: fetchAdminStats,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => shouldRetry(failureCount, error),
  });
}
