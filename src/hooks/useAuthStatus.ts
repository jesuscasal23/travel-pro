"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Returns true/false once resolved, null while loading. */
export function useAuthStatus(): boolean | null {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setIsAuthenticated(!!user));
  }, []);

  return isAuthenticated;
}
