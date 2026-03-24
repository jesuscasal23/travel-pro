import type { Metadata } from "next";
import { prisma } from "@/lib/core/prisma";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { parseItineraryData, getTripTitle } from "@/lib/utils/trip/trip-metadata";
import { TripClientProvider } from "@/components/trip/TripClientProvider";

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
      include: {
        itineraries: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!trip) {
      return { title: "Trip not found" };
    }

    const raw = trip.itineraries[0]?.data as unknown;
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

    const url = `${APP_URL}/trips/${id}`;

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

export default async function TripDetailsLayout({ params, children }: Props) {
  const { id } = await params;
  await requirePageAuth(`/trips/${id}`);

  return <TripClientProvider tripId={id}>{children}</TripClientProvider>;
}
