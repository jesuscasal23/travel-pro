/**
 * Custom assertions for discover-activities eval.
 *
 * Zod schema is inlined to match src/lib/ai/schemas/discover-activities.ts.
 */

import { z } from "zod";

// ── Zod schema (mirrors src/lib/ai/schemas/discover-activities.ts) ───────────

const ClaudeDiscoverActivitySchema = z.object({
  name: z.string().min(1).max(160),
  placeName: z.string().min(1).max(200),
  venueType: z.string().min(1).max(120),
  description: z.string().min(1).max(600),
  highlights: z.array(z.string().min(1).max(200)).min(1).max(5),
  category: z.string().min(1).max(80),
  duration: z.string().min(1).max(40),
  lat: z.number(),
  lng: z.number(),
});

// Prompt asks for exactly 25, but Haiku consistently overshoots by 1-2.
// Allow up to 30 to avoid rejecting otherwise valid responses.
const ClaudeDiscoverActivitiesOutputSchema = z.array(ClaudeDiscoverActivitySchema).max(30);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip markdown fences and extract JSON from raw Claude output.
 * Mirrors the logic in src/lib/ai/parser.ts extractJSON().
 */
function extractJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");

  const hasArr = arrStart !== -1 && arrEnd > arrStart;
  const hasObj = objStart !== -1 && objEnd > objStart;

  if (hasArr && (!hasObj || arrStart < objStart)) return text.slice(arrStart, arrEnd + 1);
  if (hasObj) return text.slice(objStart, objEnd + 1);

  return text.trim();
}

function parseActivities(output) {
  try {
    const json = extractJSON(output);
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ── 1. Valid JSON ────────────────────────────────────────────────

export function isValidJson(output) {
  try {
    const json = extractJSON(output);
    JSON.parse(json);
    return {
      pass: true,
      score: 1,
      reason: "Valid JSON",
    };
  } catch (e) {
    return {
      pass: false,
      score: 0,
      reason: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ── 2. Matches Zod schema ────────────────────────────────────────

export function matchesZodSchema(output) {
  const activities = parseActivities(output);
  if (!activities) {
    return { pass: false, score: 0, reason: "Output is not a JSON array" };
  }

  const result = ClaudeDiscoverActivitiesOutputSchema.safeParse(activities);
  if (result.success) {
    return { pass: true, score: 1, reason: `Schema valid (${activities.length} activities)` };
  }

  const issues = result.error.issues
    .slice(0, 3)
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  return { pass: false, score: 0, reason: `Schema failed: ${issues}` };
}

// ── 3. No duplicate sub-types ────────────────────────────────────

export function hasNoDuplicateSubTypes(output) {
  const activities = parseActivities(output);
  if (!activities) {
    return { pass: false, score: 0, reason: "Not a JSON array" };
  }

  const normalized = activities
    .map((a) => (a.venueType ?? "").toLowerCase().trim())
    .filter(Boolean);

  const seen = new Map();
  for (const vt of normalized) {
    seen.set(vt, (seen.get(vt) ?? 0) + 1);
  }

  const dupes = [...seen.entries()].filter(([, count]) => count > 1);
  if (dupes.length === 0) {
    return { pass: true, score: 1, reason: "No duplicate venue types" };
  }

  const dupeList = dupes.map(([type, count]) => `"${type}" x${count}`).join(", ");
  const score = dupes.length === 1 ? 0.5 : 0;
  return { pass: false, score, reason: `Duplicate venue types: ${dupeList}` };
}

// ── 4. Category coverage ─────────────────────────────────────────

const EXPECTED_CATEGORIES = ["culture", "food", "nature", "nightlife", "adventure", "relaxation"];

export function hasCategoryCoverage(output) {
  const activities = parseActivities(output);
  if (!activities) {
    return { pass: false, score: 0, reason: "Not a JSON array" };
  }

  const presentCategories = new Set(activities.map((a) => (a.category ?? "").toLowerCase().trim()));

  const covered = EXPECTED_CATEGORIES.filter((cat) =>
    [...presentCategories].some((pc) => pc.includes(cat) || cat.includes(pc))
  );

  const missing = EXPECTED_CATEGORIES.filter((cat) => !covered.includes(cat));
  const score = covered.length / EXPECTED_CATEGORIES.length;
  const pass = covered.length >= 4;

  return {
    pass,
    score,
    reason: pass
      ? `${covered.length}/${EXPECTED_CATEGORIES.length} categories covered`
      : `Only ${covered.length}/${EXPECTED_CATEGORIES.length} covered. Missing: ${missing.join(", ")}`,
  };
}

// ── 5. Specific venue names ──────────────────────────────────────

const GENERIC_PATTERNS = [
  /^a\s+/i,
  /^the\s+(local|best|nice|good)\s+/i,
  /^local\s+/i,
  /^visit\s+a\s+/i,
  /^some\s+/i,
  /^generic\s+/i,
];

const GENERIC_SINGLE_WORDS = new Set([
  "park",
  "market",
  "temple",
  "museum",
  "beach",
  "garden",
  "castle",
  "bridge",
  "tower",
  "church",
  "bar",
  "cafe",
  "restaurant",
  "hotel",
  "mall",
  "plaza",
  "square",
  "station",
]);

function normalizeName(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hasProperNounSignal(name) {
  return /^[A-Z]/.test(name) || /[^A-Za-z0-9]/.test(name);
}

function isGenericVenueName(rawName) {
  const name = rawName.trim();
  if (name.length < 3) return true;
  if (GENERIC_PATTERNS.some((p) => p.test(name))) return true;

  const words = name.split(/\s+/);
  if (words.length >= 2) return false;

  if (GENERIC_SINGLE_WORDS.has(normalizeName(name))) return true;

  return !hasProperNounSignal(name);
}

export function hasSpecificVenueNames(output) {
  const activities = parseActivities(output);
  if (!activities) {
    return { pass: false, score: 0, reason: "Not a JSON array" };
  }

  let specific = 0;
  const genericNames = [];

  for (const a of activities) {
    const name = (a.placeName ?? "").trim();
    const isGeneric = isGenericVenueName(name);

    if (isGeneric) {
      genericNames.push(name);
    } else {
      specific++;
    }
  }

  const score = activities.length > 0 ? specific / activities.length : 0;
  const pass = score >= 0.8;

  return {
    pass,
    score,
    reason: pass
      ? `${specific}/${activities.length} venue names are specific`
      : `Only ${specific}/${activities.length} specific. Generic: ${genericNames.slice(0, 3).join(", ")}`,
  };
}

// ── 6. Minimum activity count ────────────────────────────────────

export function hasMinActivityCount(output) {
  const activities = parseActivities(output);
  if (!activities) {
    return { pass: false, score: 0, reason: "Not a JSON array" };
  }

  const count = activities.length;
  const score = Math.min(1, count / 25);
  const pass = count >= 18;

  return {
    pass,
    score,
    reason: pass
      ? `${count} activities (target: 25)`
      : `Only ${count} activities (minimum: 18, target: 25)`,
  };
}
