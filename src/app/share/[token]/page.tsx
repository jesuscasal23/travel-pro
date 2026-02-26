// ============================================================
// Travel Pro — Public Share Page
// Read-only itinerary view accessible without authentication
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import SharedItineraryView from "./SharedItineraryView";
import { parseItineraryData, getTripTitle } from "@/lib/utils/trip-metadata";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://travelpro.app";

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
  const title = itinerary?.route?.length
    ? getTripTitle(itinerary.route)
    : (trip.destination ?? trip.region ?? "Trip");
  const totalDays = itinerary?.days?.length ?? 0;
  const cityCount = itinerary?.route?.length ?? 0;

  const description = [
    totalDays > 0 ? `${totalDays}-day` : null,
    cityCount > 1 ? `${cityCount}-city` : null,
    "AI-crafted itinerary",
    `for ${trip.travelers} traveller${trip.travelers !== 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(" ");

  const url = `${APP_URL}/share/${token}`;

  return {
    title: `${title} Itinerary`,
    description,
    openGraph: {
      title: `${title} Itinerary | Travel Pro`,
      description,
      url,
      siteName: "Travel Pro",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${title} Itinerary | Travel Pro`,
      description,
    },
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
    <div className="bg-background min-h-screen">
      {/* Growth CTA Banner */}
      <div className="bg-primary px-4 py-3 text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-sm font-medium">
            ✈ Like this itinerary? Plan your own trip in minutes.
          </p>
          <Link
            href="/signup"
            className="bg-background text-primary hover:bg-background/90 shrink-0 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
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
