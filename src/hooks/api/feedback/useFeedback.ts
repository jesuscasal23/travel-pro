import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { fetchFeedbackList } from "./shared";

export function useFeedback(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.feedback.list(),
    queryFn: fetchFeedbackList,
    enabled: options?.enabled ?? true,
  });
}
