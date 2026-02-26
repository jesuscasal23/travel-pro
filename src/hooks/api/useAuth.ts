"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./keys";

async function fetchAuthStatus(): Promise<boolean> {
  const client = createClient();
  if (!client) return false;
  const {
    data: { user },
  } = await client.auth.getUser();
  return !!user;
}

/** Returns true/false once resolved, null while loading. */
export function useAuthStatus(): boolean | null {
  const { data } = useQuery({
    queryKey: queryKeys.auth.status,
    queryFn: fetchAuthStatus,
    staleTime: 5 * 60 * 1000,
  });
  return data ?? null;
}
