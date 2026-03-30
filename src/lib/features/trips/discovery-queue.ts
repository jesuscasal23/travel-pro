import type { DiscoveredActivityRow } from "@/types";

interface DiscoveryQueueState {
  cards: DiscoveredActivityRow[];
  cursor: number;
  decidedCount: number;
  cityId: string | null;
  likedCount: number;
  requiredCount: number;
}

export function createDiscoveryQueueState(): DiscoveryQueueState {
  return {
    cards: [],
    cursor: 0,
    decidedCount: 0,
    cityId: null,
    likedCount: 0,
    requiredCount: 0,
  };
}

/**
 * Initialize queue from a set of activities that may already be partially swiped.
 * Only unseen activities (decision === null) go into the card deck.
 * decidedCount reflects how many were already swiped.
 */
export function initDiscoveryQueue(
  allActivities: DiscoveredActivityRow[],
  cityId: string
): DiscoveryQueueState {
  const unseen = allActivities.filter((a) => a.decision === null);
  const decidedCount = allActivities.length - unseen.length;

  return {
    cards: unseen,
    cursor: 0,
    decidedCount,
    cityId,
    likedCount: 0,
    requiredCount: 0,
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
