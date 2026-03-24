import type { ActivityDiscoveryCandidate } from "@/types";

export const DISCOVERY_TOTAL_BATCHES = 5;
export const DISCOVERY_BATCH_SIZE = 5;
export const DISCOVERY_TOTAL_CARDS = DISCOVERY_TOTAL_BATCHES * DISCOVERY_BATCH_SIZE;

export interface DiscoveryQueueState {
  batches: Record<number, ActivityDiscoveryCandidate[]>;
  cursor: number;
}

export function createDiscoveryQueueState(): DiscoveryQueueState {
  return {
    batches: {},
    cursor: 0,
  };
}

export function appendDiscoveryBatch(
  state: DiscoveryQueueState,
  batchIndex: number,
  activities: ActivityDiscoveryCandidate[]
): DiscoveryQueueState {
  return {
    ...state,
    batches: {
      ...state.batches,
      [batchIndex]: activities,
    },
  };
}

export function getOrderedDiscoveryCards(state: DiscoveryQueueState): ActivityDiscoveryCandidate[] {
  return Object.keys(state.batches)
    .map((key) => Number(key))
    .sort((a, b) => a - b)
    .flatMap((batchIndex) => state.batches[batchIndex] ?? []);
}

export function advanceDiscoveryCursor(state: DiscoveryQueueState): DiscoveryQueueState {
  return {
    ...state,
    cursor: state.cursor + 1,
  };
}
