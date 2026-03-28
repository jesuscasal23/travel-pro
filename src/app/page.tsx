import { redirect } from "next/navigation";
import { getAuthenticatedUserId } from "@/lib/core/supabase-server";

export default async function RootPage() {
  const userId = await getAuthenticatedUserId();
  redirect(userId ? "/home" : "/get-started");
}
