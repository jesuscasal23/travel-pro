import { redirect } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/core/supabase-server";

export async function requirePageAuth(nextPath: string): Promise<string> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return userId;
}
