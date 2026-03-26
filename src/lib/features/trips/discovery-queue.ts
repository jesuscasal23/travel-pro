import type { ActivityDiscoveryCandidate } from "@/types";

export const DISCOVERY_TOTAL_CARDS = 25;

export interface DiscoveryQueueState {
  cards: ActivityDiscoveryCandidate[];
  cursor: number;
}

export function createDiscoveryQueueState(): DiscoveryQueueState {
  return {
    cards: [],
    cursor: 0,
  };
}

export function setDiscoveryCards(
  state: DiscoveryQueueState,
  cards: ActivityDiscoveryCandidate[]
): DiscoveryQueueState {
  return {
    ...state,
    cards,
  };
}

export function advanceDiscoveryCursor(state: DiscoveryQueueState): DiscoveryQueueState {
  return {
    ...state,
    cursor: state.cursor + 1,
  };
}
