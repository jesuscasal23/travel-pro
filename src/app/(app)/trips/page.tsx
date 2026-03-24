import { TripsPageClient } from "@/components/trip/TripsPageClient";
import { requirePageAuth } from "@/lib/auth/require-page-auth";

export default async function TripsPage() {
  await requirePageAuth("/trips");

  return <TripsPageClient />;
}
