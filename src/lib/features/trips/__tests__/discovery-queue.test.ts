import { describe, expect, it } from "vitest";
import {
  advanceDiscoveryCursor,
  setDiscoveryCards,
  createDiscoveryQueueState,
} from "../discovery-queue";

const cards = [
  {
    name: "A1",
    description: "A1 desc",
    category: "culture",
    duration: "2h",
    googleMapsUrl: "https://maps.google.com/?q=A1",
    imageUrl: null as null,
  },
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
  it("sets discovery cards on the queue state", () => {
    let state = createDiscoveryQueueState();
    state = setDiscoveryCards(state, cards);
    expect(state.cards.map((card) => card.name)).toEqual(["A1", "B1"]);
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
