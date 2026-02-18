// ============================================================
// Travel Pro — AI Generation Pipeline
//
// Stage 1: Assemble prompt
// Stage 2: Call Claude (claude-sonnet-4-20250514, maxTokens 8000, temp 0.7)
// Stage 3: Parse + validate with Zod
// Stage 4: Enrich (visa + weather) in parallel
// Stage 5: Store in Supabase
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { SYSTEM_PROMPT_V1, assemblePrompt } from "./prompts/v1";
import { selectRoute } from "./prompts/route-selector";
import { enrichVisa, enrichWeather } from "./enrichment";
import { optimizeFlights } from "@/lib/flights/optimizer";
import { parseIataCode } from "@/lib/affiliate/link-generator";
import type { UserProfile, TripIntent, Itinerary } from "@/types";
import type { CityWithDays, FlightSkeleton } from "@/lib/flights/types";

// ============================================================
// Clients
// ============================================================

let _anthropic: Anthropic | undefined;

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _anthropic;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ============================================================
// Zod Schemas — validate Claude output shape
// ============================================================

const dayActivitySchema = z.object({
  name: z.string(),
  category: z.string(),
  icon: z.string(),
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

const cityStopSchema = z.object({
  id: z.string(),
  city: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  days: z.number(),
  countryCode: z.string(),
  iataCode: z.string().optional(),
});

const budgetSchema = z.object({
  flights: z.number(),
  accommodation: z.number(),
  activities: z.number(),
  food: z.number(),
  transport: z.number(),
  total: z.number(),
  budget: z.number(),
});

const claudeItinerarySchema = z.object({
  route: z.array(cityStopSchema),
  days: z.array(tripDaySchema),
  budget: budgetSchema,
});

type ClaudeItinerary = z.infer<typeof claudeItinerarySchema>;

// ============================================================
// Helpers
// ============================================================

/**
 * Extract raw JSON from Claude's response.
 * Claude might occasionally wrap output in markdown fences despite instructions.
 * Exported for unit testing.
 */
export function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Find the outermost JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text.trim();
}

// ============================================================
// Stage 2: Call Claude
// ============================================================

async function callClaude(userPrompt: string): Promise<string> {
  const message = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    temperature: 0.7,
    system: SYSTEM_PROMPT_V1,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Claude returned non-text content");
  }

  return block.text;
}

// ============================================================
// Stage 3: Parse + validate
// ============================================================

/** Exported for unit testing. */
export function parseAndValidate(rawOutput: string): ClaudeItinerary {
  const json = extractJSON(rawOutput);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error(`Claude output is not valid JSON: ${e instanceof Error ? e.message : e}`);
  }

  const result = claudeItinerarySchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Itinerary schema validation failed: ${issues}`);
  }

  return result.data;
}

// ============================================================
// Stage 5: Store in Supabase
// ============================================================

async function storeItinerary(tripId: string, itinerary: Itinerary): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("[pipeline] Supabase not configured — skipping storage");
    return;
  }

  const { error } = await supabase.from("itineraries").upsert(
    {
      trip_id: tripId,
      data: itinerary,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "trip_id" }
  );

  if (error) {
    // Non-fatal — log but don't throw (generation succeeded, storage is secondary)
    console.error("[pipeline] Failed to store itinerary:", error.message);
  }
}

// ============================================================
// Main: generateItinerary
// ============================================================

export async function generateItinerary(
  profile: UserProfile,
  tripIntent: TripIntent
): Promise<Itinerary> {
  // Stage A: Route selection (Haiku — fast + cheap)
  let cities: CityWithDays[] | undefined;
  let skeleton: FlightSkeleton | undefined;

  try {
    console.log("[pipeline] Stage A: Selecting route with Haiku");
    cities = await selectRoute(profile, tripIntent, getAnthropic());
    console.log(`[pipeline] Stage A complete: ${cities.map(c => c.city).join(", ")}`);

    // Stage B: Flight price optimization (Amadeus)
    const homeIata = parseIataCode(profile.homeAirport);
    const durationDays =
      tripIntent.dateStart && tripIntent.dateEnd
        ? Math.round(
            (new Date(tripIntent.dateEnd).getTime() -
              new Date(tripIntent.dateStart).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 21;

    console.log("[pipeline] Stage B: Optimizing flight prices");
    skeleton = await optimizeFlights(
      homeIata,
      cities,
      tripIntent.dateStart || new Date().toISOString().slice(0, 10),
      durationDays,
      tripIntent.travelers
    );
    console.log(
      `[pipeline] Stage B complete: €${skeleton.totalFlightCost} total flights`
    );
  } catch (e) {
    console.warn(
      "[pipeline] Route/flight optimization failed, falling back to AI estimation:",
      e instanceof Error ? e.message : e
    );
    cities = undefined;
    skeleton = undefined;
  }

  // Stage 1: Assemble prompt (inject skeleton when available)
  const userPrompt = assemblePrompt(profile, tripIntent, skeleton, cities);

  // Stage 2: Call Claude
  console.log("[pipeline] Calling Claude for trip:", tripIntent.id);
  const rawOutput = await callClaude(userPrompt);

  // Stage 3: Parse + validate
  const parsed = parseAndValidate(rawOutput);
  console.log(
    `[pipeline] Parsed itinerary: ${parsed.route.length} cities, ${parsed.days.length} days`
  );

  // Stage 4: Enrich (visa + weather) in parallel
  const [visaData, weatherData] = await Promise.all([
    enrichVisa(profile.nationality, parsed.route),
    enrichWeather(parsed.route, tripIntent.dateStart),
  ]);

  // Stage 5: Combine + store
  const itinerary: Itinerary = {
    ...parsed,
    visaData,
    weatherData,
    // Attach real flight legs when optimization succeeded (skeleton.totalFlightCost > 0)
    ...(skeleton && skeleton.totalFlightCost > 0
      ? { flightLegs: skeleton.legs }
      : {}),
  };

  await storeItinerary(tripIntent.id, itinerary);

  // Persist itinerary via Prisma (best-effort — don't fail generation if DB is down)
  try {
    const { getPrisma } = await import("@/lib/db/prisma");
    // Phase 1: itinerary is 1-to-many — find active and update, or create new
    const existing = await getPrisma().itinerary.findFirst({
      where: { tripId: tripIntent.id, isActive: true },
    });
    if (existing) {
      await getPrisma().itinerary.update({
        where: { id: existing.id },
        data: { data: itinerary as object },
      });
    } else {
      await getPrisma().itinerary.create({
        data: { tripId: tripIntent.id, data: itinerary as object },
      });
    }
  } catch (e) {
    // DB storage is best-effort — don't fail the generation
    console.error("[pipeline] Failed to persist itinerary:", e instanceof Error ? e.message : e);
  }

  console.log("[pipeline] Generation complete for trip:", tripIntent.id);
  return itinerary;
}
