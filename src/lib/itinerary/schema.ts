import { z } from "zod";

export const cityStopSchema = z.object({
  id: z.string(),
  city: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  days: z.number(),
  countryCode: z.string(),
  iataCode: z.string().optional(),
});

export const itineraryFlightLegSchema = z.object({
  fromCity: z.string(),
  toCity: z.string(),
  fromIata: z.string(),
  toIata: z.string(),
  departureDate: z.string(),
  price: z.number(),
  duration: z.string(),
  airline: z.string(),
});

export const dayActivitySchema = z.object({
  name: z.string(),
  category: z.string(),
  icon: z.string().optional(),
  why: z.string(),
  duration: z.string(),
  tip: z.string().optional(),
  food: z.string().optional(),
  cost: z.string().optional(),
});

export const tripDaySchema = z.object({
  day: z.number(),
  date: z.string(),
  city: z.string(),
  activities: z.array(dayActivitySchema),
  isTravel: z.boolean().optional(),
  travelFrom: z.string().optional(),
  travelTo: z.string().optional(),
  travelDuration: z.string().optional(),
});

export const visaInfoSchema = z.object({
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
  processingDays: z.number().optional(),
  notes: z.string(),
  icon: z.string(),
  label: z.string(),
  sourceUrl: z.string(),
  sourceLabel: z.string(),
});

export const cityWeatherSchema = z.object({
  city: z.string(),
  temp: z.string(),
  condition: z.string(),
  icon: z.string(),
});

export const cityHotelSchema = z.object({
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

export const cityAccommodationSchema = z.object({
  city: z.string(),
  countryCode: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  hotels: z.array(cityHotelSchema),
  fallbackSearchUrl: z.string(),
});

export const flightSearchResultSchema = z.object({
  price: z.number(),
  duration: z.string(),
  airline: z.string(),
  stops: z.number(),
  departureTime: z.string(),
  arrivalTime: z.string(),
  cabin: z.string(),
  bookingUrl: z.string(),
});

export const flightLegResultsSchema = z.object({
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
  flightBaselineCost: z.number().optional(),
  flightOptions: z.array(flightLegResultsSchema).optional(),
});
