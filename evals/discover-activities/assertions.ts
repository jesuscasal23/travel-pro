import { ClaudeDiscoverActivitiesOutputSchema } from "../../src/lib/ai/schemas/discover-activities";

interface GradingResult {
  pass: boolean;
  score: number;
  reason: string;
}

function parseActivities(output: string): unknown[] | null {
  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ── 1. Valid JSON ────────────────────────────────────────────────

export function isValidJson(output: string): GradingResult {
  try {
    JSON.parse(output);
    return { pass: true, score: 1, reason: "Valid JSON" };
  } catch (e) {
    return {
      pass: false,
      score: 0,
      reason: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ── 2. Matches Zod schema ────────────────────────────────────────

export function matchesZodSchema(output: string): GradingResult {
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

export function hasNoDuplicateSubTypes(output: string): GradingResult {
  const activities = parseActivities(output) as { venueType?: string }[] | null;
  if (!activities) {
    return { pass: false, score: 0, reason: "Not a JSON array" };
  }

  const normalized = activities
    .map((a) => (a.venueType ?? "").toLowerCase().trim())
    .filter(Boolean);

  const seen = new Map<string, number>();
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

export function hasCategoryCoverage(output: string): GradingResult {
  const activities = parseActivities(output) as { category?: string }[] | null;
  if (!activities) {
    return { pass: false, score: 0, reason: "Not a JSON array" };
  }

  const presentCategories = new Set(
    activities.map((a) => (a.category ?? "").toLowerCase().trim())
  );

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

export function hasSpecificVenueNames(output: string): GradingResult {
  const activities = parseActivities(output) as { placeName?: string }[] | null;
  if (!activities) {
    return { pass: false, score: 0, reason: "Not a JSON array" };
  }

  let specific = 0;
  const genericNames: string[] = [];

  for (const a of activities) {
    const name = (a.placeName ?? "").trim();
    const isGeneric =
      name.length < 3 ||
      name.split(/\s+/).length < 2 ||
      GENERIC_PATTERNS.some((p) => p.test(name));

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

export function hasMinActivityCount(output: string): GradingResult {
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
