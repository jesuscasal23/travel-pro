import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { parseItineraryData, getTripTitle } from "@/lib/utils/trip-metadata";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://travelpro.app";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Guest trips have no DB record
  if (id === "guest") {
    return {
      title: "Your Trip Itinerary",
      description: "AI-crafted travel itinerary — powered by Travel Pro.",
    };
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { itineraries: { where: { isActive: true }, take: 1 } },
    });

    if (!trip) {
      return { title: "Trip not found" };
    }

    const raw = trip.itineraries[0]?.data;
    const itinerary = raw ? parseItineraryData(raw) : null;
    const title = itinerary?.route?.length
      ? getTripTitle(itinerary.route)
      : trip.destination ?? trip.region ?? "Trip";
    const totalDays = itinerary?.days?.length ?? 0;
    const cityCount = itinerary?.route?.length ?? 0;
    const budget = itinerary?.budget?.total ?? trip.budget;

    const description = [
      totalDays > 0 ? `${totalDays}-day` : null,
      cityCount > 1 ? `${cityCount}-city` : null,
      "AI-crafted itinerary",
      budget > 0 ? `— €${budget.toLocaleString()} budget` : null,
      `for ${trip.travelers} traveller${trip.travelers !== 1 ? "s" : ""}`,
    ].filter(Boolean).join(" ");

    const url = `${APP_URL}/trip/${id}`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | Travel Pro`,
        description,
        url,
        siteName: "Travel Pro",
        type: "article",
      },
      twitter: {
        card: "summary",
        title: `${title} | Travel Pro`,
        description,
      },
    };
  } catch {
    return {
      title: "Trip Itinerary",
      description: "AI-crafted travel itinerary — powered by Travel Pro.",
    };
  }
}

export default function TripLayout({ children }: Props) {
  return children;
}
