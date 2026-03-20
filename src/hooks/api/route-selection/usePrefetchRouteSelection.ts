import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "@/hooks/api/keys";
import { fetchRouteSelection, type RouteSelectionParams } from "./shared";

export function usePrefetchRouteSelection() {
  const queryClient = useQueryClient();

  return useCallback(
    (params: RouteSelectionParams, cacheKey: string) => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.routeSelection.byParams(cacheKey),
        queryFn: () => fetchRouteSelection(params),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );
}
