"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/keys";
import { createClient } from "@/lib/core/supabase-client";

async function fetchAuthStatus(): Promise<boolean> {
  const client = createClient();
  if (!client) return false;
  const {
    data: { user },
  } = await client.auth.getUser();
  return !!user;
}

export function useAuthStatus(): boolean | null {
  const { data } = useQuery({
    queryKey: queryKeys.auth.status,
    queryFn: fetchAuthStatus,
    staleTime: 5 * 60 * 1000,
  });
  return data ?? null;
}
