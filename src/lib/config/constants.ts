// ============================================================
// Fichi — Named Constants
//
// Centralized numeric/timing constants used across the backend.
// Avoids magic numbers scattered in service files and makes
// values discoverable for agents and developers.
// ============================================================

// ── AI Pipeline ─────────────────────────────────────────────

/** Anthropic SDK timeout — fail cleanly before Vercel's 60s function limit. */
export const CLAUDE_TIMEOUT_MS = 50_000;

/** Max tokens for per-city activity generation. */
export const MAX_TOKENS_CITY_ACTIVITIES = 8_000;

/** Content filter retry: max number of retries before giving up. */
export const CONTENT_FILTER_MAX_RETRIES = 2;

/** Content filter retry: base backoff delay in ms (multiplied by attempt number). */
export const CONTENT_FILTER_BACKOFF_MS = 600;

// ── Activity Discovery ─────────────────────────────────────

/** Maximum discovery rounds (AI calls) per city. Each round generates ~25 activities. */
export const MAX_DISCOVERY_ROUNDS_PER_CITY = 5;

/** Activities must be within roughly a 60-minute drive (~45 km / 28 mi) of the city center. */
export const MAX_ACTIVITY_DISTANCE_KM = 45;

/** Minimum number of reachable cards we try to deliver per batch before auto-regenerating. */
export const MIN_REACHABLE_ACTIVITY_COUNT = 18;

/** Average driving speed (km/h) we assume when converting reachability distance to minutes. */
export const AVERAGE_CITY_DRIVE_SPEED_KMH = 45;

// ── Build Lifecycle ─────────────────────────────────────────

/** How long a "building" record can exist before being considered stale. */
export const STALE_BUILD_MAX_AGE_MS = 2 * 60 * 1000;

// ── Enrichment ──────────────────────────────────────────────

/** Timeout for Open-Meteo weather API requests. */
export const WEATHER_API_TIMEOUT_MS = 5_000;

// ── SerpApi Google Flights ──────────────────────────────

/** Timeout for SerpApi requests (scrapes Google Flights). */
export const SERPAPI_REQUEST_TIMEOUT_MS = 15_000;

/** Hard wall-clock cap for the full flight optimization pass (30–50 parallel SerpApi calls). */
export const OPTIMIZE_FLIGHTS_TIMEOUT_MS = 20_000;
