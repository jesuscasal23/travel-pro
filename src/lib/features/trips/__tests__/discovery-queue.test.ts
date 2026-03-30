import { describe, expect, it } from "vitest";
import {
  advanceDiscoveryCursor,
  setDiscoveryCards,
  initDiscoveryQueue,
  createDiscoveryQueueState,
} from "../discovery-queue";
import type { DiscoveredActivityRow } from "@/types";

function makeActivity(overrides: Partial<DiscoveredActivityRow> = {}): DiscoveredActivityRow {
  return {
    id: "act-1",
    cityId: "city-1",
    city: "Tokyo",
    name: "A1",
    placeName: null,
    venueType: null,
    description: "A1 desc",
    highlights: [],
    category: "culture",
    duration: "2h",
    googleMapsUrl: "https://maps.google.com/?q=A1",
    imageUrl: null,
    decision: null,
    decidedAt: null,
    assignedDay: null,
    assignedOrder: null,
    ...overrides,
  };
}

const cards: DiscoveredActivityRow[] = [
  makeActivity({ id: "act-1", name: "A1" }),
  makeActivity({ id: "act-2", name: "B1", category: "food", duration: "1h" }),
];

describe("discovery-queue", () => {
  it("sets discovery cards on the queue state", () => {
    let state = createDiscoveryQueueState();
    state = setDiscoveryCards(state, cards);
    expect(state.cards.map((card) => card.name)).toEqual(["A1", "B1"]);
  });

  it("advances queue cursor and decidedCount after each swipe", () => {
    let state = createDiscoveryQueueState();
    expect(state.cursor).toBe(0);
    expect(state.decidedCount).toBe(0);

    state = advanceDiscoveryCursor(state);
    expect(state.cursor).toBe(1);
    expect(state.decidedCount).toBe(1);

    state = advanceDiscoveryCursor(state);
    expect(state.cursor).toBe(2);
    expect(state.decidedCount).toBe(2);
  });

  it("initDiscoveryQueue filters out already-decided activities", () => {
    const activities: DiscoveredActivityRow[] = [
      makeActivity({
        id: "act-1",
        name: "Liked",
        decision: "liked",
        decidedAt: "2026-03-28T10:00:00Z",
      }),
      makeActivity({ id: "act-2", name: "Unseen1", decision: null }),
      makeActivity({
        id: "act-3",
        name: "Disliked",
        decision: "disliked",
        decidedAt: "2026-03-28T10:01:00Z",
      }),
      makeActivity({ id: "act-4", name: "Unseen2", decision: null }),
    ];

    const state = initDiscoveryQueue(activities, "city-1");

    expect(state.cards).toHaveLength(2);
    expect(state.cards.map((c) => c.name)).toEqual(["Unseen1", "Unseen2"]);
    expect(state.decidedCount).toBe(2);
    expect(state.cursor).toBe(0);
  });

  it("initDiscoveryQueue returns empty cards when all are decided", () => {
    const activities: DiscoveredActivityRow[] = [
      makeActivity({ id: "act-1", decision: "liked", decidedAt: "2026-03-28T10:00:00Z" }),
      makeActivity({ id: "act-2", decision: "disliked", decidedAt: "2026-03-28T10:01:00Z" }),
    ];

    const state = initDiscoveryQueue(activities, "city-1");

    expect(state.cards).toHaveLength(0);
    expect(state.decidedCount).toBe(2);
  });
});
