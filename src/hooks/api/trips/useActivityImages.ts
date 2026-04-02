import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/client/api-fetch";
import type { DiscoveredActivityRow } from "@/types";

const PREFETCH_BUFFER = 5;

interface ActivityImagesResponse {
  images: Record<
    string,
    {
      imageUrl: string | null;
      imageUrls: string[];
    }
  >;
}

interface ResolvedImageEntry {
  imageUrl: string | null;
  imageUrls: string[];
}

function normalizeImageEntry(card: DiscoveredActivityRow): ResolvedImageEntry {
  const urls =
    card.imageUrls && card.imageUrls.length > 0
      ? card.imageUrls
      : card.imageUrl
        ? [card.imageUrl]
        : [];
  return {
    imageUrl: card.imageUrl ?? urls[0] ?? null,
    imageUrls: urls,
  };
}

/**
 * Prefetches images for the current card + next PREFETCH_BUFFER cards via a single
 * batch request. Uses the activity's imageUrl if already set (from DB / background
 * resolution), otherwise resolves on demand via the batch endpoint.
 *
 * Returns a map of activityId → imageUrl for all resolved images.
 */
export function useActivityImages(
  tripId: string,
  cards: DiscoveredActivityRow[],
  cursor: number
): Map<string, ResolvedImageEntry> {
  const [imageMap, setImageMap] = useState<Map<string, ResolvedImageEntry>>(new Map());
  const inflightRef = useRef(false);

  // Seed map with any imageUrls that already exist on the cards
  useEffect(() => {
    setImageMap((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const card of cards) {
        const normalized = normalizeImageEntry(card);
        const existing = next.get(card.id);
        if (!existing) {
          next.set(card.id, normalized);
          changed = true;
          continue;
        }
        const urlsChanged =
          existing.imageUrls.length !== normalized.imageUrls.length ||
          existing.imageUrls.some((url, idx) => url !== normalized.imageUrls[idx]);
        if (existing.imageUrl !== normalized.imageUrl || urlsChanged) {
          next.set(card.id, normalized);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [cards]);

  const fetchBatch = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0 || inflightRef.current) return;
      inflightRef.current = true;

      try {
        const data = await apiFetch<ActivityImagesResponse>(
          `/api/v1/trips/${tripId}/activity-images`,
          {
            source: "useActivityImages",
            method: "POST",
            body: { activityIds: ids },
            fallbackMessage: "Failed to resolve activity images",
          }
        );

        setImageMap((prev) => {
          const next = new Map(prev);
          for (const [id, payload] of Object.entries(data.images)) {
            const normalized: ResolvedImageEntry = {
              imageUrl: payload.imageUrl ?? payload.imageUrls[0] ?? null,
              imageUrls: payload.imageUrls ?? [],
            };
            next.set(id, normalized);
          }
          return next;
        });
      } catch {
        // Image resolution is non-critical — mark IDs as attempted so we don't retry
        setImageMap((prev) => {
          const next = new Map(prev);
          for (const id of ids) {
            if (!next.has(id)) next.set(id, { imageUrl: null, imageUrls: [] });
          }
          return next;
        });
      } finally {
        inflightRef.current = false;
      }
    },
    [tripId]
  );

  // Collect unresolved IDs in the prefetch window and fire a single batch request
  useEffect(() => {
    const end = Math.min(cursor + 1 + PREFETCH_BUFFER, cards.length);
    const unresolvedIds: string[] = [];

    for (let i = cursor; i < end; i++) {
      const card = cards[i];
      if (!card) continue;
      if (imageMap.has(card.id)) continue;
      unresolvedIds.push(card.id);
    }

    void fetchBatch(unresolvedIds);
  }, [cursor, cards, imageMap, fetchBatch]);

  return imageMap;
}
