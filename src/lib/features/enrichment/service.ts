import { enrichAccommodation, enrichVisa, enrichWeather } from "@/lib/ai/enrichment";
import { z } from "zod";
import {
  EnrichAccommodationInputSchema,
  EnrichVisaInputSchema,
  EnrichWeatherInputSchema,
} from "./schemas";
import { buildSyntheticCityStops } from "./transforms";

type EnrichWeatherInput = z.infer<typeof EnrichWeatherInputSchema>;
type EnrichVisaInput = z.infer<typeof EnrichVisaInputSchema>;
type EnrichAccommodationInput = z.infer<typeof EnrichAccommodationInputSchema>;

export async function getWeatherEnrichment(input: EnrichWeatherInput) {
  return enrichWeather(buildSyntheticCityStops(input.route), input.dateStart);
}

export async function getVisaEnrichment(input: EnrichVisaInput) {
  return enrichVisa(input.nationality, buildSyntheticCityStops(input.route));
}

export async function getAccommodationEnrichment(input: EnrichAccommodationInput) {
  return enrichAccommodation(input.route, input.dateStart, input.travelers, input.travelStyle);
}
