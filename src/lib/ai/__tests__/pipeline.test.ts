// @vitest-environment node
import { describe, it, expect } from "vitest";
import { extractJSON, parseAndValidate } from "../pipeline";

// ── extractJSON ──────────────────────────────────────────────

describe("extractJSON", () => {
  it("extracts JSON from markdown code fences", () => {
    const input = '```json\n{"route": []}\n```';
    expect(extractJSON(input)).toBe('{"route": []}');
  });

  it("extracts JSON from code fences without language tag", () => {
    const input = '```\n{"key": "value"}\n```';
    expect(extractJSON(input)).toBe('{"key": "value"}');
  });

  it("extracts outermost JSON object from surrounding text", () => {
    const input = 'Here is the itinerary:\n{"route": []} \nEnjoy!';
    expect(extractJSON(input)).toBe('{"route": []}');
  });

  it("handles nested braces correctly", () => {
    const input = '{"outer": {"inner": 1}}';
    expect(extractJSON(input)).toBe('{"outer": {"inner": 1}}');
  });

  it("returns trimmed text when no JSON found", () => {
    const input = "  no json here  ";
    expect(extractJSON(input)).toBe("no json here");
  });

  it("prefers code fence over raw JSON", () => {
    const input = 'preamble {"not": "this"}\n```json\n{"yes": "this"}\n```';
    expect(extractJSON(input)).toBe('{"yes": "this"}');
  });

  it("handles multiline JSON in fences", () => {
    const input = '```json\n{\n  "route": [],\n  "days": []\n}\n```';
    const result = extractJSON(input);
    expect(JSON.parse(result)).toEqual({ route: [], days: [] });
  });
});

// ── parseAndValidate ─────────────────────────────────────────

const validItinerary = {
  route: [
    { id: "tokyo", city: "Tokyo", country: "Japan", lat: 35.68, lng: 139.69, days: 5, countryCode: "JP" },
  ],
  days: [
    {
      day: 1,
      date: "2026-03-01",
      city: "Tokyo",
      activities: [
        { name: "Visit Senso-ji", category: "Culture", icon: "🏯", why: "Historic temple", duration: "2h" },
      ],
    },
  ],
  budget: {
    flights: 800,
    accommodation: 1200,
    activities: 500,
    food: 600,
    transport: 300,
    total: 3400,
    budget: 5000,
  },
};

describe("parseAndValidate", () => {
  it("parses valid JSON itinerary", () => {
    const result = parseAndValidate(JSON.stringify(validItinerary));
    expect(result.route).toHaveLength(1);
    expect(result.route[0].city).toBe("Tokyo");
    expect(result.days).toHaveLength(1);
    expect(result.budget.total).toBe(3400);
  });

  it("parses JSON wrapped in code fences", () => {
    const input = "```json\n" + JSON.stringify(validItinerary) + "\n```";
    const result = parseAndValidate(input);
    expect(result.route[0].city).toBe("Tokyo");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseAndValidate("not json at all")).toThrow("not valid JSON");
  });

  it("throws on valid JSON but wrong schema", () => {
    expect(() => parseAndValidate('{"wrong": "shape"}')).toThrow("schema validation failed");
  });

  it("throws when route is missing required fields", () => {
    const bad = { ...validItinerary, route: [{ city: "Tokyo" }] };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow("schema validation failed");
  });

  it("throws when budget is missing fields", () => {
    const bad = { ...validItinerary, budget: { total: 100 } };
    expect(() => parseAndValidate(JSON.stringify(bad))).toThrow("schema validation failed");
  });

  it("allows optional fields to be absent", () => {
    // tip, food, cost are optional on activities; iataCode is optional on route
    const result = parseAndValidate(JSON.stringify(validItinerary));
    expect(result.route[0].iataCode).toBeUndefined();
  });
});
