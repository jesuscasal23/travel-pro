// ============================================================
// Travel Pro — Named Constants
//
// Centralized numeric/timing constants used across the backend.
// Avoids magic numbers scattered in service files and makes
// values discoverable for agents and developers.
// ============================================================

// ── AI Pipeline ─────────────────────────────────────────────

/** Anthropic SDK timeout — fail cleanly before Vercel's 60s function limit. */
export const CLAUDE_TIMEOUT_MS = 50_000;

/** Max tokens for full multi-city itinerary generation. */
export const MAX_TOKENS_MULTI_CITY = 10_000;

/** Max tokens for single-city itinerary generation. */
export const MAX_TOKENS_SINGLE_CITY = 8_000;

/** Max tokens for route-only generation (no activities). */
export const MAX_TOKENS_ROUTE_ONLY = 4_000;

/** Max tokens for per-city activity generation. */
export const MAX_TOKENS_CITY_ACTIVITIES = 8_000;

/** Content filter retry: max number of retries before giving up. */
export const CONTENT_FILTER_MAX_RETRIES = 2;

/** Content filter retry: base backoff delay in ms (multiplied by attempt number). */
export const CONTENT_FILTER_BACKOFF_MS = 600;

// ── Generation Lifecycle ────────────────────────────────────

/** How long a "generating" record can exist before being considered stale. */
export const STALE_GENERATION_MAX_AGE_MS = 2 * 60 * 1000;

// ── Enrichment ──────────────────────────────────────────────

/** Redis cache TTL for weather data. */
export const WEATHER_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Timeout for Open-Meteo weather API requests. */
export const WEATHER_API_TIMEOUT_MS = 5_000;

// ── SerpApi Google Flights ──────────────────────────────

/** Timeout for SerpApi requests (scrapes Google Flights). */
export const SERPAPI_REQUEST_TIMEOUT_MS = 15_000;

/** Hard wall-clock cap for the full flight optimization pass (30–50 parallel SerpApi calls). */
export const OPTIMIZE_FLIGHTS_TIMEOUT_MS = 20_000;
