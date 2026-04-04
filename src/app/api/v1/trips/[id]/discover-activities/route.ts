import { apiHandler, assertTripAccess, parseAndValidateRequest } from "@/lib/api/helpers";
import { BadRequestError, ActiveItineraryNotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/core/prisma";
import { resolveTripUserProfile } from "@/lib/features/profile/profile-service";
import { findActiveItinerary } from "@/lib/features/trips/itinerary-service";
import { DiscoverActivitiesInputSchema } from "@/lib/features/trips/schemas";
import { discoverActivities } from "@/lib/features/trips/discover-activities-service";
import { parseItineraryData } from "@/lib/utils/trip/trip-metadata";
import { haversineDistanceKm, distanceKmToMinutes } from "@/lib/utils/geo/distance";
import { AVERAGE_CITY_DRIVE_SPEED_KMH, MAX_ACTIVITY_DISTANCE_KM } from "@/lib/config/constants";
import type { CityStop, DiscoveredActivityRow } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const E2E_DISCOVERY_TEMPLATES = [
  {
    suffix: "old-quarter-walk",
    name: "Old Quarter Walk",
    placeName: "Historic Center",
    venueType: "neighborhood",
    description: "A relaxed walk through the most characterful streets, landmarks, and cafes.",
    highlights: ["Easy first-day activity", "Great for orientation", "Photo-friendly route"],
    category: "culture",
    duration: "2h",
    latOffset: 0.008,
    lngOffset: 0.006,
  },
  {
    suffix: "market-lunch",
    name: "Market Lunch Stop",
    placeName: "Central Market",
    venueType: "market",
    description: "A lively local market stop with easy bites and a strong sense of place.",
    highlights: ["Good food pick", "Works midday", "Local atmosphere"],
    category: "food",
    duration: "90m",
    latOffset: -0.005,
    lngOffset: 0.004,
  },
  {
    suffix: "viewpoint-loop",
    name: "Viewpoint Loop",
    placeName: "City Viewpoint",
    venueType: "scenic_point",
    description: "A scenic walk with a high-value panorama and a simple route back into town.",
    highlights: ["Strong views", "Good golden hour option", "Low logistics overhead"],
    category: "nature",
    duration: "2h",
    latOffset: 0.011,
    lngOffset: -0.003,
  },
  {
    suffix: "design-museum",
    name: "Design Museum Visit",
    placeName: "Design Museum",
    venueType: "museum",
    description: "A compact museum visit that adds a clear indoor culture option to the mix.",
    highlights: ["Indoor fallback", "Cultural depth", "Easy to combine with food nearby"],
    category: "culture",
    duration: "90m",
    latOffset: -0.004,
    lngOffset: -0.005,
  },
  {
    suffix: "evening-streets",
    name: "Evening Streets & Bars",
    placeName: "Nightlife Quarter",
    venueType: "district",
    description:
      "A casual evening route with bars, people-watching, and a stronger after-dark feel.",
    highlights: ["Evening option", "Works late", "Social energy"],
    category: "nightlife",
    duration: "3h",
    latOffset: 0.003,
    lngOffset: 0.009,
  },
] as const;

export const POST = apiHandler(
  "POST /api/v1/trips/:id/discover-activities",
  async (req, params) => {
    const tripAccess = await assertTripAccess(req, params.id, { requireTripOwner: true });
    if (!tripAccess) {
      throw new Error("Trip access unexpectedly missing for discover activities request");
    }

    const {
      profile: requestProfile,
      cityId,
      excludeNames,
    } = await parseAndValidateRequest(req, DiscoverActivitiesInputSchema);

    if (req.headers.get("x-e2e-test") === "1") {
      return Response.json(
        await getE2EDiscoveryFixture(params.id, tripAccess.profileId, cityId, excludeNames)
      );
    }

    const profile = await resolveTripUserProfile(tripAccess.profileId, requestProfile);
    const { activities, roundLimitReached, reachability } = await discoverActivities({
      tripId: params.id,
      profileId: tripAccess.profileId ?? null,
      profile,
      cityId,
      excludeNames,
      signal: req.signal,
    });

    return Response.json({ activities, roundLimitReached, reachability });
  }
);

async function getE2EDiscoveryFixture(
  tripId: string,
  profileId: string | null,
  cityId: string,
  excludeNames?: string[]
) {
  const itineraryRecord = await findActiveItinerary(tripId);
  if (!itineraryRecord) {
    throw new ActiveItineraryNotFoundError({ tripId });
  }

  const itinerary = parseItineraryData(itineraryRecord.data);
  const city = itinerary.route.find((stop) => stop.id === cityId);
  if (!city) {
    throw new BadRequestError(`City "${cityId}" not found in itinerary route`, { cityId, tripId });
  }

  let rows = await prisma.discoveredActivity.findMany({
    where: { tripId, cityId },
    orderBy: { createdAt: "asc" },
  });

  if (rows.length === 0) {
    await prisma.discoveredActivity.createMany({
      data: buildE2EDiscoveredActivityRows(tripId, profileId, city),
    });

    rows = await prisma.discoveredActivity.findMany({
      where: { tripId, cityId },
      orderBy: { createdAt: "asc" },
    });
  }

  const filteredRows =
    excludeNames && excludeNames.length > 0
      ? rows.filter((row) => !excludeNames.includes(row.name))
      : rows;

  return {
    activities: filteredRows.map((row) => toDiscoveredActivityRow(row, city)),
    roundLimitReached: filteredRows.length === 0,
    reachability: {
      filtered: 0,
      verifiedFiltered: 0,
      autoRegenerated: false,
    },
  };
}

function buildE2EDiscoveredActivityRows(tripId: string, profileId: string | null, city: CityStop) {
  return E2E_DISCOVERY_TEMPLATES.map((template) => {
    const lat = city.lat + template.latOffset;
    const lng = city.lng + template.lngOffset;
    const googlePlaceId = `e2e-${city.id}-${template.suffix}`;
    const displayName = `${city.city} ${template.name}`;

    return {
      tripId,
      profileId,
      cityId: city.id,
      city: city.city,
      name: displayName,
      placeName: `${city.city} ${template.placeName}`,
      venueType: template.venueType,
      description: template.description,
      highlights: [...template.highlights],
      category: template.category,
      duration: template.duration,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(displayName)}`,
      googlePlaceId,
      imageUrl: null,
      imageUrls: [],
      lat,
      lng,
      decision: null,
      decidedAt: null,
      assignedDay: null,
      assignedOrder: null,
    };
  });
}

function toDiscoveredActivityRow(
  row: {
    id: string;
    cityId: string;
    city: string;
    name: string;
    placeName: string | null;
    venueType: string | null;
    description: string;
    highlights: string[];
    category: string;
    duration: string;
    googleMapsUrl: string | null;
    googlePlaceId: string | null;
    imageUrl: string | null;
    imageUrls: string[];
    lat: number | null;
    lng: number | null;
    decision: string | null;
    decidedAt: Date | null;
    assignedDay: number | null;
    assignedOrder: number | null;
  },
  city: CityStop
): DiscoveredActivityRow {
  return {
    id: row.id,
    cityId: row.cityId,
    city: row.city,
    name: row.name,
    placeName: row.placeName,
    venueType: row.venueType,
    description: row.description,
    highlights: row.highlights,
    category: row.category,
    duration: row.duration,
    googleMapsUrl: row.googleMapsUrl ?? "",
    googlePlaceId: row.googlePlaceId,
    imageUrl: row.imageUrl,
    imageUrls: row.imageUrls,
    lat: row.lat,
    lng: row.lng,
    reachableMinutes: computeReachableMinutes(city, row.lat, row.lng),
    decision: row.decision as DiscoveredActivityRow["decision"],
    decidedAt: row.decidedAt?.toISOString() ?? null,
    assignedDay: row.assignedDay,
    assignedOrder: row.assignedOrder,
  };
}

function computeReachableMinutes(
  city: CityStop,
  lat: number | null,
  lng: number | null
): number | null {
  if (lat == null || lng == null) return null;
  const distanceKm = haversineDistanceKm(city.lat, city.lng, lat, lng);
  if (!Number.isFinite(distanceKm) || distanceKm > MAX_ACTIVITY_DISTANCE_KM) return null;
  return distanceKmToMinutes(distanceKm, AVERAGE_CITY_DRIVE_SPEED_KMH);
}
