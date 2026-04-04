import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/prisma";
import { deriveCartCostSummary, deriveCartSlots } from "./cart-derive";
import type { CartTrip, FlightSelection, HotelSelection } from "@/types";
import type { UpsertFlightSelectionInput, UpsertHotelSelectionInput } from "./schemas";

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
  ...FLIGHT_SELECTION_SELECT,
  trip: TRIP_DATE_SELECT,
} as const;

const HOTEL_CART_SELECT = {
  ...HOTEL_SELECTION_SELECT,
  trip: TRIP_DATE_SELECT,
} as const;

type CartTripAccumulator = Omit<CartTrip, "slots" | "costSummary">;
type SortOrder = "asc" | "desc";
type SelectionSort = Record<string, SortOrder>;

interface SelectionCartTripFields {
  dateStart: string;
  dateEnd: string;
  destination: string | null;
  region: string;
}

interface SelectionCartRecordBase {
  tripId: string;
  trip: SelectionCartTripFields;
}

type FlightCartRecord = SelectionCartRecordBase & Record<string, unknown>;
type HotelCartRecord = SelectionCartRecordBase & Record<string, unknown>;

interface SelectionModelConfig<
  TInput,
  TSelection,
  TCartRecord extends SelectionCartRecordBase,
  TWhereUnique extends object,
  TCreate extends object,
  TUpdate extends object,
> {
  selectionSelect: object;
  cartSelect: object;
  listOrderBy: SelectionSort;
  cartOrderBy: SelectionSort;
  findManyForTrip: (args: {
    where: { tripId: string };
    select: object;
    orderBy: SelectionSort;
  }) => Promise<unknown[]>;
  upsert: (args: {
    where: TWhereUnique;
    create: TCreate;
    update: TUpdate;
    select: object;
  }) => Promise<unknown>;
  deleteByOwner: (args: { where: { id: string; profileId: string } }) => Promise<unknown>;
  updateBooked: (args: {
    where: { id: string; profileId: string };
    data: { booked: boolean; bookedAt: Date | null };
    select: object;
  }) => Promise<unknown>;
  findManyForCart: (args: {
    where: { profileId: string; trip: { dateEnd: { gte: string } } };
    select: object;
    orderBy: SelectionSort;
  }) => Promise<TCartRecord[]>;
  countUnbooked: (args: { where: { profileId: string; booked: false } }) => Promise<number>;
  buildWhereUnique: (tripId: string, data: TInput) => TWhereUnique;
  buildCreate: (tripId: string, profileId: string, data: TInput) => TCreate;
  buildUpdate: (profileId: string, data: TInput) => TUpdate;
  appendCartSelection: (tripMap: Map<string, CartTripAccumulator>, row: TCartRecord) => void;
}

function resetBookedState() {
  return { booked: false, bookedAt: null };
}

function ensureCartTripAccumulator(
  tripMap: Map<string, CartTripAccumulator>,
  record: SelectionCartRecordBase
) {
  const existing = tripMap.get(record.tripId);
  if (existing) return existing;

  const created: CartTripAccumulator = {
    tripId: record.tripId,
    dateStart: record.trip.dateStart,
    dateEnd: record.trip.dateEnd,
    destination: record.trip.destination,
    region: record.trip.region,
    flights: [],
    hotels: [],
  };

  tripMap.set(record.tripId, created);
  return created;
}

function appendFlightCartSelection(
  tripMap: Map<string, CartTripAccumulator>,
  row: FlightCartRecord
) {
  const trip = ensureCartTripAccumulator(tripMap, row);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { trip: _trip, ...selection } = row;
  trip.flights.push(selection as unknown as FlightSelection);
}

function appendHotelCartSelection(tripMap: Map<string, CartTripAccumulator>, row: HotelCartRecord) {
  const trip = ensureCartTripAccumulator(tripMap, row);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { trip: _trip, ...selection } = row;
  trip.hotels.push(selection as unknown as HotelSelection);
}

function createSelectionModel<
  TInput,
  TSelection,
  TCartRecord extends SelectionCartRecordBase,
  TWhereUnique extends object,
  TCreate extends object,
  TUpdate extends object,
>(config: SelectionModelConfig<TInput, TSelection, TCartRecord, TWhereUnique, TCreate, TUpdate>) {
  return {
    listSelectionsForTrip(tripId: string): Promise<TSelection[]> {
      return config.findManyForTrip({
        where: { tripId },
        select: config.selectionSelect,
        orderBy: config.listOrderBy,
      }) as Promise<TSelection[]>;
    },

    upsertSelection(tripId: string, profileId: string, data: TInput): Promise<TSelection> {
      return config.upsert({
        where: config.buildWhereUnique(tripId, data),
        create: config.buildCreate(tripId, profileId, data),
        update: {
          ...config.buildUpdate(profileId, data),
          ...resetBookedState(),
        } as TUpdate,
        select: config.selectionSelect,
      }) as Promise<TSelection>;
    },

    removeSelection(id: string, profileId: string) {
      return config.deleteByOwner({ where: { id, profileId } });
    },

    markSelectionBooked(id: string, profileId: string, booked = true): Promise<TSelection> {
      return config.updateBooked({
        where: { id, profileId },
        data: { booked, bookedAt: booked ? new Date() : null },
        select: config.selectionSelect,
      }) as Promise<TSelection>;
    },

    listCartSelections(profileId: string, todayStr: string) {
      return config.findManyForCart({
        where: { profileId, trip: { dateEnd: { gte: todayStr } } },
        select: config.cartSelect,
        orderBy: config.cartOrderBy,
      });
    },

    countUnbooked(profileId: string) {
      return config.countUnbooked({ where: { profileId, booked: false } });
    },

    appendCartSelection(tripMap: Map<string, CartTripAccumulator>, row: TCartRecord) {
      config.appendCartSelection(tripMap, row);
    },
  };
}

const flightSelectionModel = createSelectionModel<
  UpsertFlightSelectionInput,
  FlightSelection,
  FlightCartRecord,
  Prisma.FlightSelectionWhereUniqueInput,
  Prisma.FlightSelectionUpsertArgs["create"],
  Prisma.FlightSelectionUpsertArgs["update"]
>({
  selectionSelect: FLIGHT_SELECTION_SELECT,
  cartSelect: FLIGHT_CART_SELECT,
  listOrderBy: { createdAt: "asc" },
  cartOrderBy: { departureDate: "asc" },
  findManyForTrip: (args) => prisma.flightSelection.findMany(args),
  upsert: (args) => prisma.flightSelection.upsert(args),
  deleteByOwner: (args) => prisma.flightSelection.delete(args),
  updateBooked: (args) => prisma.flightSelection.update(args),
  findManyForCart: (args) => prisma.flightSelection.findMany(args) as Promise<FlightCartRecord[]>,
  countUnbooked: (args) => prisma.flightSelection.count(args),
  buildWhereUnique: (tripId, data) => ({
    flight_selection_leg_unique: {
      tripId,
      fromIata: data.fromIata,
      toIata: data.toIata,
      departureDate: data.departureDate,
    },
  }),
  buildCreate: (tripId, profileId, data) => ({
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
  }),
  buildUpdate: (profileId, data) => ({
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
  }),
  appendCartSelection: appendFlightCartSelection,
});

const hotelSelectionModel = createSelectionModel<
  UpsertHotelSelectionInput,
  HotelSelection,
  HotelCartRecord,
  Prisma.HotelSelectionWhereUniqueInput,
  Prisma.HotelSelectionUpsertArgs["create"],
  Prisma.HotelSelectionUpsertArgs["update"]
>({
  selectionSelect: HOTEL_SELECTION_SELECT,
  cartSelect: HOTEL_CART_SELECT,
  listOrderBy: { createdAt: "asc" },
  cartOrderBy: { checkIn: "asc" },
  findManyForTrip: (args) => prisma.hotelSelection.findMany(args),
  upsert: (args) => prisma.hotelSelection.upsert(args),
  deleteByOwner: (args) => prisma.hotelSelection.delete(args),
  updateBooked: (args) => prisma.hotelSelection.update(args),
  findManyForCart: (args) => prisma.hotelSelection.findMany(args) as Promise<HotelCartRecord[]>,
  countUnbooked: (args) => prisma.hotelSelection.count(args),
  buildWhereUnique: (tripId, data) => ({
    hotel_selection_city_unique: {
      tripId,
      city: data.city,
      checkIn: data.checkIn,
    },
  }),
  buildCreate: (tripId, profileId, data) => ({
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
  }),
  buildUpdate: (profileId, data) => ({
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
  }),
  appendCartSelection: appendHotelCartSelection,
});

export function getFlightSelectionsForTrip(tripId: string) {
  return flightSelectionModel.listSelectionsForTrip(tripId);
}

export function upsertFlightSelection(
  tripId: string,
  profileId: string,
  data: UpsertFlightSelectionInput
) {
  return flightSelectionModel.upsertSelection(tripId, profileId, data);
}

export function removeFlightSelection(id: string, profileId: string) {
  return flightSelectionModel.removeSelection(id, profileId);
}

export function markFlightBooked(id: string, profileId: string, booked = true) {
  return flightSelectionModel.markSelectionBooked(id, profileId, booked);
}

export function getHotelSelectionsForTrip(tripId: string) {
  return hotelSelectionModel.listSelectionsForTrip(tripId);
}

export function upsertHotelSelection(
  tripId: string,
  profileId: string,
  data: UpsertHotelSelectionInput
) {
  return hotelSelectionModel.upsertSelection(tripId, profileId, data);
}

export function removeHotelSelection(id: string, profileId: string) {
  return hotelSelectionModel.removeSelection(id, profileId);
}

export function markHotelBooked(id: string, profileId: string, booked = true) {
  return hotelSelectionModel.markSelectionBooked(id, profileId, booked);
}

export async function getCartForProfile(profileId: string): Promise<CartTrip[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const [flights, hotels] = await Promise.all([
    flightSelectionModel.listCartSelections(profileId, todayStr),
    hotelSelectionModel.listCartSelections(profileId, todayStr),
  ]);

  const tripMap = new Map<string, CartTripAccumulator>();

  for (const flight of flights) {
    flightSelectionModel.appendCartSelection(tripMap, flight);
  }

  for (const hotel of hotels) {
    hotelSelectionModel.appendCartSelection(tripMap, hotel);
  }

  return Array.from(tripMap.values())
    .map((trip) => ({
      ...trip,
      slots: deriveCartSlots(trip.flights, trip.hotels),
      costSummary: deriveCartCostSummary(trip.flights, trip.hotels),
    }))
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
}

export async function getUnbookedCountForProfile(profileId: string): Promise<number> {
  const [flightCount, hotelCount] = await Promise.all([
    flightSelectionModel.countUnbooked(profileId),
    hotelSelectionModel.countUnbooked(profileId),
  ]);

  return flightCount + hotelCount;
}
