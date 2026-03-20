import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { fetchProfile } from "./shared";

export function useProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: fetchProfile,
    enabled: options?.enabled ?? true,
  });
}
