import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "@/hooks/api/keys";
import { fetchRouteSelection, type RouteSelectionParams } from "./shared";

export function useFetchRouteSelection() {
  const queryClient = useQueryClient();

  return useCallback(
    async (params: RouteSelectionParams, cacheKey: string) => {
      return queryClient.fetchQuery({
        queryKey: queryKeys.routeSelection.byParams(cacheKey),
        queryFn: () => fetchRouteSelection(params),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );
}
