import type { ReactNode } from "react";
import { TripErrorState } from "@/components/trip/TripErrorState";
import { TripNotFound } from "@/components/trip/TripNotFound";
import type { Itinerary } from "@/types";
import type { useTrip } from "@/hooks/api";

interface UseTripGuardsOptions {
  tripSyncPending: boolean;
  tripUnavailable: boolean;
  tripQueryStatus: number | null;
  tripQuery: ReturnType<typeof useTrip>;
  isAuthenticated: boolean | undefined;
  itinerary: Itinerary | null;
  isGuest: boolean;
}

export function useTripGuards({
  tripSyncPending,
  tripUnavailable,
  tripQueryStatus,
  tripQuery,
  isAuthenticated,
  itinerary,
  isGuest,
}: UseTripGuardsOptions): ReactNode | null {
  const tripLoadFailedWithoutLocal = !isGuest && tripQuery.isError && !itinerary;

  if (tripSyncPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[image:var(--gradient-page-trip)]">
        <div className="border-brand-primary h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent" />
      </div>
    );
  }

  if (tripUnavailable || tripLoadFailedWithoutLocal) {
    console.warn("[TripClientProvider] Trip load blocked", {
      reason: tripUnavailable ? "api_returned_null" : "query_error_no_local",
      status: tripQueryStatus,
      queryStatus: tripQuery.status,
      queryError: tripQuery.error?.message,
      hasLocalItinerary: !!itinerary,
      isAuthenticated,
    });

    if (tripUnavailable) {
      return <TripNotFound isAuthenticated={isAuthenticated ?? false} />;
    }

    if (tripQueryStatus === 429) {
      return (
        <TripErrorState
          isAuthenticated={isAuthenticated ?? false}
          title="Too many requests"
          description="You have been temporarily rate limited while loading this trip. Wait a moment, then try again."
          onRetry={() => void tripQuery.refetch()}
        />
      );
    }

    if (tripQueryStatus === 403) {
      return (
        <TripErrorState
          isAuthenticated={isAuthenticated ?? false}
          title="You do not have access to this trip"
          description="This trip is not available for your account right now."
          ctaLabel="Reload trip"
          onRetry={() => void tripQuery.refetch()}
        />
      );
    }

    return (
      <TripErrorState
        isAuthenticated={isAuthenticated ?? false}
        title="We could not load this trip"
        description="This looks temporary. Try again in a moment."
        onRetry={() => void tripQuery.refetch()}
      />
    );
  }

  return null;
}
