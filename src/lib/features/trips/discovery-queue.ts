import type { DiscoveredActivityRow } from "@/types";

export const DISCOVERY_TOTAL_CARDS = 25;

export interface DiscoveryQueueState {
  cards: DiscoveredActivityRow[];
  cursor: number;
  decidedCount: number;
}

export function createDiscoveryQueueState(): DiscoveryQueueState {
  return {
    cards: [],
    cursor: 0,
    decidedCount: 0,
  };
}

/**
 * Initialize queue from a set of activities that may already be partially swiped.
 * Only unseen activities (decision === null) go into the card deck.
 * decidedCount reflects how many were already swiped.
 */
export function initDiscoveryQueue(allActivities: DiscoveredActivityRow[]): DiscoveryQueueState {
  const unseen = allActivities.filter((a) => a.decision === null);
  const decidedCount = allActivities.length - unseen.length;

  return {
    cards: unseen,
    cursor: 0,
    decidedCount,
  };
}

export function setDiscoveryCards(
  state: DiscoveryQueueState,
  cards: DiscoveredActivityRow[]
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
    decidedCount: state.decidedCount + 1,
  };
}
