import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { createFeedback, type CreateFeedbackPayload } from "./shared";

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => createFeedback(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
    },
  });
}
