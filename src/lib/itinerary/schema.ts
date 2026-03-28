import { z } from "zod";

/** Base geographic fields shared by all city-related schemas. */
export const cityGeoSchema = z.object({
  city: z.string(),
  country: z.string(),
  countryCode: z.string(),
  lat: z.number(),
  lng: z.number(),
});

const cityStopSchema = cityGeoSchema.extend({
  id: z.string(),
  days: z.number(),
  iataCode: z.string().optional(),
});

const itineraryFlightLegSchema = z.object({
  fromCity: z.string(),
  toCity: z.string(),
  fromIata: z.string(),
  toIata: z.string(),
  departureDate: z.string(),
  price: z.number(),
  duration: z.string(),
  airline: z.string(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  stops: z.number().optional(),
});

const dayActivitySchema = z.object({
  name: z.string(),
  category: z.string(),
  icon: z.string().optional(),
  why: z.string(),
  duration: z.string(),
  tip: z.string().optional(),
  food: z.string().optional(),
  cost: z.string().optional(),
});

const tripDaySchema = z.object({
  day: z.number(),
  date: z.string(),
  city: z.string(),
  activities: z.array(dayActivitySchema),
  isTravel: z.boolean().optional(),
  travelFrom: z.string().optional(),
  travelTo: z.string().optional(),
  travelDuration: z.string().optional(),
});

const visaInfoSchema = z.object({
  country: z.string(),
  countryCode: z.string(),
  requirement: z.enum([
    "visa-free",
    "visa-on-arrival",
    "e-visa",
    "eta",
    "visa-required",
    "no-admission",
  ]),
  maxStayDays: z.number(),
  notes: z.string(),
  icon: z.string(),
  label: z.string(),
  sourceUrl: z.string(),
  sourceLabel: z.string(),
});

const cityWeatherSchema = z.object({
  city: z.string(),
  temp: z.string(),
  condition: z.string(),
  icon: z.string(),
});

const cityHotelSchema = z.object({
  hotelId: z.string(),
  name: z.string(),
  city: z.string(),
  rating: z.number().optional(),
  pricePerNight: z.number().optional(),
  totalPrice: z.number().optional(),
  currency: z.string(),
  address: z.string().optional(),
  distance: z.string().optional(),
  bookingUrl: z.string(),
  why: z.string(),
});

const cityAccommodationSchema = z.object({
  city: z.string(),
  countryCode: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  hotels: z.array(cityHotelSchema),
  fallbackSearchUrl: z.string(),
});

const flightSearchResultSchema = z.object({
  price: z.number(),
  duration: z.string(),
  airline: z.string(),
  stops: z.number(),
  departureTime: z.string(),
  arrivalTime: z.string(),
  cabin: z.string(),
  bookingUrl: z.string(),
});

const flightLegResultsSchema = z.object({
  fromIata: z.string(),
  toIata: z.string(),
  departureDate: z.string(),
  results: z.array(flightSearchResultSchema),
  fetchedAt: z.number(),
});

export const itineraryCoreSchema = z.object({
  route: z.array(cityStopSchema),
  days: z.array(tripDaySchema),
});

export const itinerarySchema = itineraryCoreSchema.extend({
  visaData: z.array(visaInfoSchema).optional(),
  weatherData: z.array(cityWeatherSchema).optional(),
  accommodationData: z.array(cityAccommodationSchema).optional(),
  flightLegs: z.array(itineraryFlightLegSchema).optional(),
  flightOptions: z.array(flightLegResultsSchema).optional(),
});
