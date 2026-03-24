import { describe, expect, it } from "vitest";
import {
  advanceDiscoveryCursor,
  appendDiscoveryBatch,
  createDiscoveryQueueState,
  getOrderedDiscoveryCards,
} from "../discovery-queue";

const batch0 = [
  {
    name: "A1",
    description: "A1 desc",
    category: "culture",
    duration: "2h",
    googleMapsUrl: "https://maps.google.com/?q=A1",
    imageUrl: null as null,
  },
];

const batch1 = [
  {
    name: "B1",
    description: "B1 desc",
    category: "food",
    duration: "1h",
    googleMapsUrl: "https://maps.google.com/?q=B1",
    imageUrl: null as null,
  },
];

describe("discovery-queue", () => {
  it("keeps deterministic card order even when batches arrive out of order", () => {
    let state = createDiscoveryQueueState();

    state = appendDiscoveryBatch(state, 1, batch1);
    state = appendDiscoveryBatch(state, 0, batch0);

    const cards = getOrderedDiscoveryCards(state);
    expect(cards.map((card) => card.name)).toEqual(["A1", "B1"]);
  });

  it("advances queue cursor after each swipe decision", () => {
    let state = createDiscoveryQueueState();
    expect(state.cursor).toBe(0);

    state = advanceDiscoveryCursor(state);
    expect(state.cursor).toBe(1);

    state = advanceDiscoveryCursor(state);
    expect(state.cursor).toBe(2);
  });
});
