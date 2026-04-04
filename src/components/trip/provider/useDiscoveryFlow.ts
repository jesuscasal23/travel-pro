import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActivityImages, useDiscoverActivities, useRecordActivitySwipe } from "@/hooks/api";
import {
  advanceDiscoveryCursor,
  createDiscoveryQueueState,
  initDiscoveryQueue,
  isPreviouslyCompletedDiscoveryBatch,
} from "@/lib/features/trips/discovery-queue";
import { getDiscoverableCities, arraysEqual, formatReachabilityNotice } from "./utils";
import type { DiscoveryStatus, Itinerary, TravelStyle } from "@/types";

interface UseDiscoveryFlowOptions {
  tripId: string;
  itinerary: Itinerary | null;
  serverDiscoveryStatus: DiscoveryStatus;
  hasDiscoveryProfile: boolean;
  requestProfile?: {
    nationality: string;
    homeAirport: string;
    travelStyle: TravelStyle;
    interests: string[];
  } | null;
  isGuest: boolean;
}

interface UseDiscoveryFlowResult {
  discoveryStatus: DiscoveryStatus;
  discoveryCards: ReturnType<typeof createDiscoveryQueueState>["cards"];
  discoveryCardsWithImages: ReturnType<typeof createDiscoveryQueueState>["cards"];
  discoveryCursor: number;
  discoveryTotalTarget: number;
  discoveryIsLoading: boolean;
  discoveryError: string | null;
  discoveryNotice: string | null;
  onDiscoverySwipe: (decision: "liked" | "disliked") => void;
  discoveryCityIndex: number;
  discoveryTotalCities: number;
  discoveryLikedCount: number;
  discoveryRequiredCount: number;
  discoveryRoundLimitReached: boolean;
}

function buildAutoDiscoveryRequestKey(
  tripId: string,
  cityId: string,
  requestProfile?: UseDiscoveryFlowOptions["requestProfile"]
) {
  const profileKey = requestProfile
    ? [
        requestProfile.nationality,
        requestProfile.homeAirport,
        requestProfile.travelStyle,
        requestProfile.interests.join(","),
      ].join("|")
    : "server-profile";

  return `${tripId}:${cityId}:${profileKey}`;
}

export function useDiscoveryFlow({
  tripId,
  itinerary,
  serverDiscoveryStatus,
  hasDiscoveryProfile,
  requestProfile,
  isGuest,
}: UseDiscoveryFlowOptions): UseDiscoveryFlowResult {
  const discoverActivitiesMutation = useDiscoverActivities();
  const recordActivitySwipeMutation = useRecordActivitySwipe();
  const autoDiscoveryRequestKeyRef = useRef<string | null>(null);
  const [queueState, setQueueState] = useState(createDiscoveryQueueState);
  const [discoveryDone, setDiscoveryDone] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveryNotice, setDiscoveryNotice] = useState<string | null>(null);
  const [discoveryStatusOverride, setDiscoveryStatusOverride] = useState<DiscoveryStatus | null>(
    null
  );

  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [requiredCount, setRequiredCount] = useState(0);
  const [roundLimitReached, setRoundLimitReached] = useState(false);

  const discoveryCards = queueState.cards;
  const discoveryStatus = discoveryStatusOverride ?? serverDiscoveryStatus;
  const discoverableCities = useMemo(
    () => getDiscoverableCities(itinerary?.route ?? []),
    [itinerary?.route]
  );
  const currentDiscoveryCity = discoverableCities[currentCityIndex] ?? null;
  const autoDiscoveryRequestKey = useMemo(() => {
    if (!currentDiscoveryCity) return null;
    return buildAutoDiscoveryRequestKey(tripId, currentDiscoveryCity.id, requestProfile);
  }, [currentDiscoveryCity, requestProfile, tripId]);

  const shouldRunDiscovery =
    !isGuest &&
    !!itinerary &&
    itinerary.route.length > 0 &&
    (discoveryStatus === "pending" || discoveryStatus === "in_progress");

  useEffect(() => {
    if (
      !shouldRunDiscovery ||
      discoveryDone ||
      discoverActivitiesMutation.isPending ||
      !currentDiscoveryCity ||
      !hasDiscoveryProfile ||
      !autoDiscoveryRequestKey
    ) {
      return;
    }

    if (autoDiscoveryRequestKeyRef.current === autoDiscoveryRequestKey) {
      return;
    }

    autoDiscoveryRequestKeyRef.current = autoDiscoveryRequestKey;

    let cancelled = false;
    setDiscoveryError(null);
    setDiscoveryNotice(null);

    discoverActivitiesMutation
      .mutateAsync({
        tripId,
        cityId: currentDiscoveryCity.id,
        profile: requestProfile ?? undefined,
      })
      .then((result) => {
        if (cancelled) return;
        setDiscoveryError(null);
        setDiscoveryNotice(formatReachabilityNotice(result.reachability));
        if (result.roundLimitReached) setRoundLimitReached(true);
        const queue = initDiscoveryQueue(result.activities, currentDiscoveryCity.id);

        if (queue.cards.length > 0) {
          setDiscoveryStatusOverride("in_progress");
          setQueueState(queue);
          setDiscoveryDone(true);
          return;
        }

        setQueueState(queue);
        setDiscoveryDone(true);

        if (result.roundLimitReached) {
          setDiscoveryStatusOverride("in_progress");
          return;
        }

        if (!isPreviouslyCompletedDiscoveryBatch(result.activities, queue)) {
          setDiscoveryError("We couldn't load activity cards for this city. Please try again.");
          return;
        }

        if (currentCityIndex < discoverableCities.length - 1) {
          setCurrentCityIndex((i) => i + 1);
        } else {
          setDiscoveryStatusOverride("completed");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setDiscoveryError(
          error instanceof Error ? error.message : "Could not load activity recommendations"
        );
        setDiscoveryNotice(null);
        setDiscoveryDone(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoDiscoveryRequestKey,
    shouldRunDiscovery,
    discoveryDone,
    currentDiscoveryCity?.id,
    hasDiscoveryProfile,
    tripId,
    requestProfile,
    currentCityIndex,
    discoverActivitiesMutation.isPending,
  ]);

  const activityImageMap = useActivityImages(tripId, discoveryCards, queueState.cursor);
  const discoveryCardsWithImages = useMemo(
    () =>
      discoveryCards.map((card) => {
        const resolved = activityImageMap.get(card.id);
        if (!resolved) return card;

        const nextImageUrls =
          resolved.imageUrls.length > 0
            ? resolved.imageUrls
            : card.imageUrls?.length
              ? card.imageUrls
              : resolved.imageUrl
                ? [resolved.imageUrl]
                : [];
        const nextPrimary = resolved.imageUrl ?? nextImageUrls[0] ?? card.imageUrl ?? null;

        const currentImageUrls = card.imageUrls ?? (card.imageUrl ? [card.imageUrl] : []);
        const urlsChanged = !arraysEqual(currentImageUrls, nextImageUrls);
        const primaryChanged = nextPrimary !== card.imageUrl;

        if (!urlsChanged && !primaryChanged) {
          return card;
        }

        return {
          ...card,
          imageUrl: nextPrimary,
          imageUrls: nextImageUrls,
        };
      }),
    [discoveryCards, activityImageMap]
  );

  const handleDiscoverySwipe = useCallback(
    (decision: "liked" | "disliked") => {
      const card = discoveryCards[queueState.cursor];
      if (!card || !currentDiscoveryCity) return;

      setQueueState((prev) => advanceDiscoveryCursor(prev));

      recordActivitySwipeMutation.mutate(
        {
          tripId,
          activityId: card.id,
          decision,
          cityId: currentDiscoveryCity.id,
        },
        {
          onSuccess: (data) => {
            setLikedCount(data.cityProgress.likedCount);
            setRequiredCount(data.cityProgress.requiredCount);

            if (data.allCitiesComplete) {
              setDiscoveryStatusOverride("completed");
              return;
            }

            if (data.cityProgress.cityComplete && data.nextCityId) {
              const nextIdx = discoverableCities.findIndex((c) => c.id === data.nextCityId);
              if (nextIdx !== -1) {
                setCurrentCityIndex(nextIdx);
                setDiscoveryDone(false);
                setLikedCount(0);
                setRequiredCount(0);
                setRoundLimitReached(false);
              }
            } else if (data.batchComplete && !data.cityProgress.cityComplete) {
              if (roundLimitReached) {
                return;
              }
              const allNames = discoveryCards.map((c) => c.name);
              setDiscoveryError(null);
              setDiscoveryDone(false);
              setDiscoveryNotice(null);
              discoverActivitiesMutation
                .mutateAsync({
                  tripId,
                  cityId: currentDiscoveryCity.id,
                  profile: requestProfile ?? undefined,
                  excludeNames: allNames,
                })
                .then((result) => {
                  if (result.roundLimitReached) setRoundLimitReached(true);
                  setDiscoveryNotice(formatReachabilityNotice(result.reachability));
                  const queue = initDiscoveryQueue(result.activities, currentDiscoveryCity.id);
                  setQueueState(queue);
                  setDiscoveryDone(true);
                })
                .catch((error) => {
                  setDiscoveryError(
                    error instanceof Error ? error.message : "Could not load more activities"
                  );
                  setDiscoveryNotice(null);
                  setDiscoveryDone(true);
                });
            }
          },
        }
      );
    },
    [
      discoveryCards,
      queueState.cursor,
      currentDiscoveryCity,
      recordActivitySwipeMutation,
      tripId,
      discoverableCities,
      roundLimitReached,
      discoverActivitiesMutation,
      requestProfile,
    ]
  );

  return {
    discoveryStatus,
    discoveryCards,
    discoveryCardsWithImages,
    discoveryCursor: queueState.cursor,
    discoveryTotalTarget: discoveryCards.length,
    discoveryIsLoading:
      shouldRunDiscovery &&
      (discoverActivitiesMutation.isPending ||
        (discoveryCards.length === 0 && !discoveryError && !discoveryDone)),
    discoveryError,
    discoveryNotice,
    onDiscoverySwipe: handleDiscoverySwipe,
    discoveryCityIndex: currentCityIndex,
    discoveryTotalCities: discoverableCities.length,
    discoveryLikedCount: likedCount,
    discoveryRequiredCount: requiredCount,
    discoveryRoundLimitReached: roundLimitReached,
  };
}
