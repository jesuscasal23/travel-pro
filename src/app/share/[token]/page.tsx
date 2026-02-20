// ============================================================
// Travel Pro — Public Share Page
// Read-only itinerary view accessible without authentication
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import SharedItineraryView from "./SharedItineraryView";
import { parseItineraryData } from "@/lib/utils/trip-metadata";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const trip = await prisma.trip.findFirst({
    where: { shareToken: token },
    include: { itineraries: { where: { isActive: true }, take: 1 } },
  });

  if (!trip) {
    return { title: "Trip not found" };
  }

  const raw = trip.itineraries[0]?.data;
  const itinerary = raw ? parseItineraryData(raw) : null;
  const cities = itinerary?.route?.map((c) => c.city).join(", ") ?? "Trip";

  return {
    title: `${cities} Itinerary`,
    description: `AI-crafted travel itinerary for ${cities} — ${trip.travelers} traveller${trip.travelers !== 1 ? "s" : ""}, ${trip.region}.`,
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const trip = await prisma.trip.findFirst({
    where: { shareToken: token },
    include: { itineraries: { where: { isActive: true }, take: 1 } },
  });

  if (!trip || trip.itineraries.length === 0) {
    notFound();
  }

  const itinerary = parseItineraryData(trip.itineraries[0].data);

  return (
    <div className="min-h-screen bg-background">
      {/* Growth CTA Banner */}
      <div className="bg-primary text-white py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm font-medium">
            ✈ Like this itinerary? Plan your own personalised trip in minutes.
          </p>
          <Link
            href="/signup"
            className="shrink-0 bg-white text-primary text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
          >
            Start free →
          </Link>
        </div>
      </div>

      {/* Read-only itinerary view */}
      <SharedItineraryView itinerary={itinerary} trip={trip} />
    </div>
  );
}
