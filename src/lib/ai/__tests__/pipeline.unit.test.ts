// @vitest-environment node
// ============================================================
// Unit tests for AI pipeline helpers
//
// Covers:
//   extractJSON  — strips markdown fences, extracts JSON objects
//   parseAndValidate — Zod schema validation of Claude's itinerary output
//
// NOTE: The Anthropic client is constructed at module load time but never
// called by these functions, so no API key is needed for these tests.
// ============================================================

import { describe, it, expect } from "vitest";
import { extractJSON, parseAndValidate } from "@/lib/ai/parser";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const validActivity = {
  name: "Senso-ji Temple",
  category: "culture",
  icon: "⛩️",
  why: "Tokyo's oldest temple — stunning gate and shopping street.",
  duration: "2h",
};

const validRoute = [
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    lat: 35.68,
    lng: 139.69,
    days: 3,
    countryCode: "JP",
  },
];

const validDay = {
  day: 1,
  date: "Oct 1",
  city: "Tokyo",
  activities: [validActivity],
};

const validItinerary = {
  route: validRoute,
  days: [validDay],
};

// ── extractJSON ───────────────────────────────────────────────────────────────

describe("extractJSON", () => {
  it("returns a plain JSON string unchanged (no fences)", () => {
    const input = JSON.stringify(validItinerary);
    expect(extractJSON(input)).toBe(input);
  });

  it("strips ```json ... ``` markdown fences", () => {
    const inner = JSON.stringify(validItinerary);
    const fenced = "```json\n" + inner + "\n```";
    expect(extractJSON(fenced).trim()).toBe(inner);
  });

  it("strips ``` ... ``` fences with no language tag", () => {
    const inner = JSON.stringify(validItinerary);
    const fenced = "```\n" + inner + "\n```";
    expect(extractJSON(fenced).trim()).toBe(inner);
  });

  it("extracts the JSON object from text with leading prose", () => {
    const json = JSON.stringify({ key: "value" });
    const input = `Here is the generated itinerary:\n${json}\nI hope that helps!`;
    expect(extractJSON(input)).toBe(json);
  });

  it("extracts JSON from text that has trailing commentary after the closing brace", () => {
    const json = JSON.stringify({ a: 1 });
    const input = `${json} — this is the result.`;
    // lastIndexOf("}") finds the closing brace, so result includes json
    expect(extractJSON(input)).toContain('"a":1');
  });

  it("returns trimmed string when no braces are found", () => {
    const input = "   no braces here   ";
    expect(extractJSON(input)).toBe("no braces here");
  });

  it("handles extra whitespace inside the fenced block", () => {
    const inner = JSON.stringify({ a: 1 });
    const fenced = "```json   \n  " + inner + "  \n```";
    expect(extractJSON(fenced).trim()).toBe(inner);
  });

  it("extracts a bare JSON array", () => {
    const input = JSON.stringify([{ name: "Activity 1" }, { name: "Activity 2" }]);
    expect(extractJSON(input)).toBe(input);
  });

  it("extracts a JSON array surrounded by prose", () => {
    const arr = JSON.stringify([{ name: "Temple Visit" }]);
    const input = `Here are the activities:\n${arr}\nEnjoy your trip!`;
    expect(extractJSON(input)).toBe(arr);
  });

  it("strips markdown fences from a JSON array", () => {
    const arr = JSON.stringify([{ a: 1 }, { a: 2 }]);
    const fenced = "```json\n" + arr + "\n```";
    expect(extractJSON(fenced).trim()).toBe(arr);
  });

  it("prefers object braces over array brackets when both exist", () => {
    const input = '{"activities": [{"name": "test"}]}';
    const result = extractJSON(input);
    expect(result).toBe(input);
    expect(result.startsWith("{")).toBe(true);
  });
});

// ── parseAndValidate ──────────────────────────────────────────────────────────

describe("parseAndValidate", () => {
  // ── Valid input ───────────────────────────────────────────────────────────

  it("accepts a fully valid itinerary JSON string", () => {
    const result = parseAndValidate(JSON.stringify(validItinerary));
    expect(result.route).toHaveLength(1);
    expect(result.route[0].city).toBe("Tokyo");
    expect(result.days).toHaveLength(1);
    expect(result.days[0].activities[0].name).toBe("Senso-ji Temple");
  });

  it("accepts a valid itinerary where optional activity fields are absent", () => {
    const minimal = {
      ...validItinerary,
      days: [
        {
          ...validDay,
          activities: [
            { name: "Walk", category: "explore", icon: "🚶", why: "Nice.", duration: "1h" },
          ],
        },
      ],
    };
    expect(() => parseAndValidate(JSON.stringify(minimal))).not.toThrow();
  });

  it("accepts a multi-city route with multiple days", () => {
    const multi = {
      route: [
        ...validRoute,
        {
          id: "kyoto",
          city: "Kyoto",
          country: "Japan",
          lat: 35.01,
          lng: 135.77,
          days: 2,
          countryCode: "JP",
        },
      ],
      days: [validDay, { day: 2, date: "Oct 2", city: "Kyoto", activities: [validActivity] }],
    };
    const result = parseAndValidate(JSON.stringify(multi));
    expect(result.route).toHaveLength(2);
    expect(result.days).toHaveLength(2);
  });

  it("accepts a travel day with isTravel, travelFrom, travelTo, travelDuration", () => {
    const travelDay = {
      day: 2,
      date: "Oct 2",
      city: "Kyoto",
      isTravel: true,
      travelFrom: "Tokyo",
      travelTo: "Kyoto",
      travelDuration: "2h 15min",
      activities: [validActivity],
    };
    const itinerary = { ...validItinerary, days: [travelDay] };
    expect(() => parseAndValidate(JSON.stringify(itinerary))).not.toThrow();
  });

  it("accepts an itinerary wrapped in markdown fences (runs through extractJSON)", () => {
    const fenced = "```json\n" + JSON.stringify(validItinerary) + "\n```";
    expect(() => parseAndValidate(fenced)).not.toThrow();
  });

  it("accepts all optional activity fields when present", () => {
    const richActivity = {
      ...validActivity,
      tip: "Arrive early",
      food: "Try melon pan nearby",
      cost: "Free",
    };
    const itinerary = { ...validItinerary, days: [{ ...validDay, activities: [richActivity] }] };
    const result = parseAndValidate(JSON.stringify(itinerary));
    expect(result.days[0].activities[0].tip).toBe("Arrive early");
    expect(result.days[0].activities[0].food).toBe("Try melon pan nearby");
    expect(result.days[0].activities[0].cost).toBe("Free");
  });

  // ── Route-only itinerary (empty activities) ─────────────────────────────────

  it("accepts a route-only itinerary with empty activities arrays", () => {
    const routeOnly = {
      route: validRoute,
      days: [
        { day: 1, date: "Oct 1", city: "Tokyo", activities: [] },
        { day: 2, date: "Oct 2", city: "Tokyo", activities: [] },
        { day: 3, date: "Oct 3", city: "Tokyo", activities: [] },
      ],
    };
    const result = parseAndValidate(JSON.stringify(routeOnly));
    expect(result.route).toHaveLength(1);
    expect(result.days).toHaveLength(3);
    expect(result.days[0].activities).toHaveLength(0);
    expect(result.days[1].activities).toHaveLength(0);
  });

  it("accepts a route-only travel day with empty activities", () => {
    const routeOnly = {
      route: [
        ...validRoute,
        {
          id: "kyoto",
          city: "Kyoto",
          country: "Japan",
          lat: 35.01,
          lng: 135.77,
          days: 2,
          countryCode: "JP",
        },
      ],
      days: [
        { day: 1, date: "Oct 1", city: "Tokyo", activities: [] },
        {
          day: 2,
          date: "Oct 2",
          city: "Kyoto",
          isTravel: true,
          travelFrom: "Tokyo",
          travelTo: "Kyoto",
          travelDuration: "2h 15min",
          activities: [],
        },
      ],
    };
    const result = parseAndValidate(JSON.stringify(routeOnly));
    expect(result.days[1].isTravel).toBe(true);
    expect(result.days[1].travelFrom).toBe("Tokyo");
    expect(result.days[1].activities).toHaveLength(0);
  });

  // ── Missing top-level fields ──────────────────────────────────────────────

  it("throws when route array is missing", () => {
    const bad = { days: [validDay] };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow();
  });

  it("throws when days array is missing", () => {
    const bad = { route: validRoute };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow();
  });

  it("throws on an empty object", () => {
    expect(() => parseAndValidate("{}")).toThrow();
  });

  // ── Invalid field types ───────────────────────────────────────────────────

  it("throws when an activity is missing the required 'name' field", () => {
    const badActivity = { category: "culture", icon: "⛩️", why: "y", duration: "2h" };
    const bad = { ...validItinerary, days: [{ ...validDay, activities: [badActivity] }] };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow();
  });

  it("throws when an activity is missing the required 'why' field", () => {
    const badActivity = { name: "Temple", category: "culture", icon: "⛩️", duration: "2h" };
    const bad = { ...validItinerary, days: [{ ...validDay, activities: [badActivity] }] };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow();
  });

  it("throws when route city lat is a string instead of number", () => {
    const badRoute = [{ ...validRoute[0], lat: "35.68" }];
    const bad = { ...validItinerary, route: badRoute };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow();
  });

  it("throws when route city lng is a string instead of number", () => {
    const badRoute = [{ ...validRoute[0], lng: "139.69" }];
    const bad = { ...validItinerary, route: badRoute };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow();
  });

  it("throws when days is a string instead of an array", () => {
    const bad = { ...validItinerary, days: "not an array" };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow();
  });

  // ── Invalid JSON ──────────────────────────────────────────────────────────

  it("throws with a 'not valid JSON' message on completely unparseable input", () => {
    expect(() => parseAndValidate("not json at all")).toThrow(/not valid JSON/i);
  });

  it("throws with a 'not valid JSON' message on truncated JSON", () => {
    expect(() => parseAndValidate('{"route": [')).toThrow(/not valid JSON/i);
  });

  // ── Error message quality ─────────────────────────────────────────────────

  it("throws a descriptive schema validation error message on shape mismatch", () => {
    const bad = { route: validRoute, days: [{ day: "one" }] };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow(/schema validation failed/i);
  });
});
