import { prisma } from "@/lib/core/prisma";
import type { CartTrip, FlightSelection, HotelSelection } from "@/types";
import type { UpsertFlightSelectionInput, UpsertHotelSelectionInput } from "./schemas";

// ── Select shapes ───────────────────────────────────────────────

const FLIGHT_SELECTION_SELECT = {
  id: true,
  tripId: true,
  profileId: true,
  selectionType: true,
  fromIata: true,
  toIata: true,
  departureDate: true,
  direction: true,
  airline: true,
  price: true,
  duration: true,
  stops: true,
  departureTime: true,
  arrivalTime: true,
  cabin: true,
  bookingToken: true,
  bookingUrl: true,
  booked: true,
  bookedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const HOTEL_SELECTION_SELECT = {
  id: true,
  tripId: true,
  profileId: true,
  selectionType: true,
  city: true,
  countryCode: true,
  checkIn: true,
  checkOut: true,
  hotelName: true,
  hotelId: true,
  rating: true,
  pricePerNight: true,
  totalPrice: true,
  currency: true,
  bookingUrl: true,
  booked: true,
  bookedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const TRIP_DATE_SELECT = {
  select: { dateStart: true, dateEnd: true, destination: true, region: true },
} as const;

const FLIGHT_CART_SELECT = {
  id: true,
  tripId: true,
  profileId: true,
  selectionType: true,
  fromIata: true,
  toIata: true,
  departureDate: true,
  direction: true,
  airline: true,
  price: true,
  duration: true,
  stops: true,
  departureTime: true,
  arrivalTime: true,
  cabin: true,
  bookingToken: true,
  bookingUrl: true,
  booked: true,
  bookedAt: true,
  createdAt: true,
  updatedAt: true,
  trip: TRIP_DATE_SELECT,
} as const;

const HOTEL_CART_SELECT = {
  id: true,
  tripId: true,
  profileId: true,
  selectionType: true,
  city: true,
  countryCode: true,
  checkIn: true,
  checkOut: true,
  hotelName: true,
  hotelId: true,
  rating: true,
  pricePerNight: true,
  totalPrice: true,
  currency: true,
  bookingUrl: true,
  booked: true,
  bookedAt: true,
  createdAt: true,
  updatedAt: true,
  trip: TRIP_DATE_SELECT,
} as const;

// ── Flight selections ───────────────────────────────────────────

export async function getFlightSelectionsForTrip(tripId: string) {
  return prisma.flightSelection.findMany({
    where: { tripId },
    select: FLIGHT_SELECTION_SELECT,
    orderBy: { createdAt: "asc" },
  }) as unknown as FlightSelection[];
}

export async function upsertFlightSelection(
  tripId: string,
  profileId: string,
  data: UpsertFlightSelectionInput
) {
  return prisma.flightSelection.upsert({
    where: {
      flight_selection_leg_unique: {
        tripId,
        fromIata: data.fromIata,
        toIata: data.toIata,
        departureDate: data.departureDate,
      },
    },
    create: {
      tripId,
      profileId,
      selectionType: data.selectionType,
      fromIata: data.fromIata,
      toIata: data.toIata,
      departureDate: data.departureDate,
      direction: data.direction,
      airline: data.airline,
      price: data.price,
      duration: data.duration,
      stops: data.stops,
      departureTime: data.departureTime ?? null,
      arrivalTime: data.arrivalTime ?? null,
      cabin: data.cabin,
      bookingToken: data.bookingToken ?? null,
      bookingUrl: data.bookingUrl,
    },
    update: {
      profileId,
      selectionType: data.selectionType,
      direction: data.direction,
      airline: data.airline,
      price: data.price,
      duration: data.duration,
      stops: data.stops,
      departureTime: data.departureTime ?? null,
      arrivalTime: data.arrivalTime ?? null,
      cabin: data.cabin,
      bookingToken: data.bookingToken ?? null,
      bookingUrl: data.bookingUrl,
      booked: false,
      bookedAt: null,
    },
    select: FLIGHT_SELECTION_SELECT,
  }) as unknown as FlightSelection;
}

export async function removeFlightSelection(id: string, profileId: string) {
  return prisma.flightSelection.delete({
    where: { id, profileId },
  });
}

export async function markFlightBooked(id: string, profileId: string, booked = true) {
  return prisma.flightSelection.update({
    where: { id, profileId },
    data: { booked, bookedAt: booked ? new Date() : null },
    select: FLIGHT_SELECTION_SELECT,
  }) as unknown as FlightSelection;
}

// ── Hotel selections ────────────────────────────────────────────

export async function getHotelSelectionsForTrip(tripId: string) {
  return prisma.hotelSelection.findMany({
    where: { tripId },
    select: HOTEL_SELECTION_SELECT,
    orderBy: { createdAt: "asc" },
  }) as unknown as HotelSelection[];
}

export async function upsertHotelSelection(
  tripId: string,
  profileId: string,
  data: UpsertHotelSelectionInput
) {
  return prisma.hotelSelection.upsert({
    where: {
      hotel_selection_city_unique: {
        tripId,
        city: data.city,
        checkIn: data.checkIn,
      },
    },
    create: {
      tripId,
      profileId,
      selectionType: data.selectionType,
      city: data.city,
      countryCode: data.countryCode,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      hotelName: data.hotelName,
      hotelId: data.hotelId,
      rating: data.rating ?? null,
      pricePerNight: data.pricePerNight ?? null,
      totalPrice: data.totalPrice ?? null,
      currency: data.currency,
      bookingUrl: data.bookingUrl,
    },
    update: {
      profileId,
      selectionType: data.selectionType,
      countryCode: data.countryCode,
      checkOut: data.checkOut,
      hotelName: data.hotelName,
      hotelId: data.hotelId,
      rating: data.rating ?? null,
      pricePerNight: data.pricePerNight ?? null,
      totalPrice: data.totalPrice ?? null,
      currency: data.currency,
      bookingUrl: data.bookingUrl,
      booked: false,
      bookedAt: null,
    },
    select: HOTEL_SELECTION_SELECT,
  }) as unknown as HotelSelection;
}

export async function removeHotelSelection(id: string, profileId: string) {
  return prisma.hotelSelection.delete({
    where: { id, profileId },
  });
}

export async function markHotelBooked(id: string, profileId: string, booked = true) {
  return prisma.hotelSelection.update({
    where: { id, profileId },
    data: { booked, bookedAt: booked ? new Date() : null },
    select: HOTEL_SELECTION_SELECT,
  }) as unknown as HotelSelection;
}

// ── Cart (cross-trip) ───────────────────────────────────────────

export async function getCartForProfile(profileId: string): Promise<CartTrip[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().split("T")[0];

  const [flights, hotels] = await Promise.all([
    prisma.flightSelection.findMany({
      where: { profileId, trip: { dateEnd: { gte: todayStr } } },
      select: FLIGHT_CART_SELECT,
      orderBy: { departureDate: "asc" },
    }),
    prisma.hotelSelection.findMany({
      where: { profileId, trip: { dateEnd: { gte: todayStr } } },
      select: HOTEL_CART_SELECT,
      orderBy: { checkIn: "asc" },
    }),
  ]);

  const tripMap = new Map<string, CartTrip>();

  for (const f of flights) {
    if (!tripMap.has(f.tripId)) {
      tripMap.set(f.tripId, {
        tripId: f.tripId,
        dateStart: f.trip.dateStart,
        dateEnd: f.trip.dateEnd,
        destination: f.trip.destination,
        region: f.trip.region,
        flights: [],
        hotels: [],
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { trip: _t1, ...flightSelection } = f;
    tripMap.get(f.tripId)!.flights.push(flightSelection as unknown as FlightSelection);
  }

  for (const h of hotels) {
    if (!tripMap.has(h.tripId)) {
      tripMap.set(h.tripId, {
        tripId: h.tripId,
        dateStart: h.trip.dateStart,
        dateEnd: h.trip.dateEnd,
        destination: h.trip.destination,
        region: h.trip.region,
        flights: [],
        hotels: [],
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { trip: _t2, ...hotelSelection } = h;
    tripMap.get(h.tripId)!.hotels.push(hotelSelection as unknown as HotelSelection);
  }

  return Array.from(tripMap.values()).sort(
    (a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
  );
}

export async function getUnbookedCountForProfile(profileId: string): Promise<number> {
  const [flightCount, hotelCount] = await Promise.all([
    prisma.flightSelection.count({ where: { profileId, booked: false } }),
    prisma.hotelSelection.count({ where: { profileId, booked: false } }),
  ]);
  return flightCount + hotelCount;
}
