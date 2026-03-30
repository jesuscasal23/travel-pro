import { z } from "zod";

const iataCode = z
  .string()
  .length(3)
  .transform((v) => v.toUpperCase());
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const UpsertFlightSelectionSchema = z.object({
  selectionType: z.enum(["platform", "manual"]),
  fromIata: iataCode,
  toIata: iataCode,
  departureDate: dateString,
  direction: z.enum(["outbound", "return", "internal"]),
  airline: z.string().min(1),
  price: z.number().min(0),
  duration: z.string(),
  stops: z.number().int().min(0),
  departureTime: z.string().nullable().optional(),
  arrivalTime: z.string().nullable().optional(),
  cabin: z.string().default("ECONOMY"),
  bookingToken: z.string().nullable().optional(),
  bookingUrl: z.string().url(),
});

export type UpsertFlightSelectionInput = z.infer<typeof UpsertFlightSelectionSchema>;

export const UpsertHotelSelectionSchema = z.object({
  selectionType: z.enum(["platform", "manual"]),
  city: z.string().min(1),
  countryCode: z.string().length(2),
  checkIn: dateString,
  checkOut: dateString,
  hotelName: z.string().min(1),
  hotelId: z.string().min(1),
  rating: z.number().nullable().optional(),
  pricePerNight: z.number().nullable().optional(),
  totalPrice: z.number().nullable().optional(),
  currency: z.string().default("EUR"),
  bookingUrl: z.string().url(),
});

export type UpsertHotelSelectionInput = z.infer<typeof UpsertHotelSelectionSchema>;

export const SelectionIdSchema = z.object({
  id: z.string().uuid(),
});
