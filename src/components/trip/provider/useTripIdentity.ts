import { useAuthStatus, useTravelerPreferences, useTrip } from "@/hooks/api";
import { usePlanFormStore } from "@/stores/usePlanFormStore";
import { ApiError } from "@/lib/client/api-fetch";
import type { AssignedActivity, DiscoveryStatus, TravelStyle } from "@/types";

interface TripIdentityParams {
  tripId: string;
}

interface TripIdentityResult {
  tripId: string;
  isGuest: boolean;
  tripQuery: ReturnType<typeof useTrip>;
  tripData: ReturnType<typeof useTrip>["data"];
  assignedActivities: AssignedActivity[];
  serverDiscoveryStatus: DiscoveryStatus;
  isAuthenticated: ReturnType<typeof useAuthStatus>;
  tripSyncPending: boolean;
  tripUnavailable: boolean;
  tripQueryStatus: number | null;
  travelerPreferencesSource: "server" | "transient" | null;
  requestProfile?: {
    nationality: string;
    homeAirport: string;
    travelStyle: TravelStyle;
    interests: string[];
  } | null;
  hasDiscoveryProfile: boolean;
  nationality: string;
  homeAirport: string;
  travelStyle: TravelStyle;
  interests: string[];
  dateStart: string | null;
  dateEnd: string | null;
  travelers: number | null;
  tripDirection: string | null;
}

export function useTripIdentity({ tripId }: TripIdentityParams): TripIdentityResult {
  const isGuest = tripId === "guest";
  const isAuthenticated = useAuthStatus();
  const travelerPreferences = useTravelerPreferences({ includeTransientFallback: true });
  const nationality = travelerPreferences.data?.nationality ?? "";
  const homeAirport = travelerPreferences.data?.homeAirport ?? "";
  const travelStyle: TravelStyle = travelerPreferences.data?.travelStyle ?? "smart-budget";
  const interests = travelerPreferences.data?.interests ?? [];
  const transientProfile =
    nationality && homeAirport ? { nationality, homeAirport, travelStyle, interests } : null;
  const requestProfile = travelerPreferences.source === "server" ? undefined : transientProfile;
  const hasDiscoveryProfile = travelerPreferences.source === "server" || requestProfile !== null;

  const tripQueryEnabled = !isGuest;
  const tripQuery = useTrip(tripId, { enabled: tripQueryEnabled });
  const tripData = tripQuery.data;

  const planFormDateStart = usePlanFormStore((s) => s.dateStart);
  const planFormDateEnd = usePlanFormStore((s) => s.dateEnd);
  const planFormTravelers = usePlanFormStore((s) => s.travelers);
  const planFormTripDirection = usePlanFormStore((s) => s.tripDirection);

  const dateStart = tripData?.dateStart ?? planFormDateStart ?? null;
  const dateEnd = tripData?.dateEnd ?? planFormDateEnd ?? null;
  const travelers = tripData?.travelers ?? planFormTravelers ?? null;
  const tripDirection =
    ((tripData as unknown as Record<string, unknown>)?.tripDirection as string | undefined) ??
    planFormTripDirection ??
    null;

  const assignedActivities: AssignedActivity[] =
    (tripData as { assignedActivities?: AssignedActivity[] })?.assignedActivities ?? [];

  const serverDiscoveryStatus = (tripData?.itineraries?.[0]?.discoveryStatus ??
    "completed") as DiscoveryStatus;

  const tripSyncPending = !isGuest && tripQuery.isPending;
  const tripUnavailable = !isGuest && tripQuery.isSuccess && tripQuery.data === null;
  const tripQueryStatus = tripQuery.error instanceof ApiError ? tripQuery.error.status : null;

  return {
    tripId,
    isGuest,
    tripQuery,
    tripData,
    assignedActivities,
    serverDiscoveryStatus,
    isAuthenticated,
    tripSyncPending,
    tripUnavailable,
    tripQueryStatus,
    travelerPreferencesSource: travelerPreferences.source,
    requestProfile,
    hasDiscoveryProfile,
    nationality,
    homeAirport,
    travelStyle,
    interests,
    dateStart,
    dateEnd,
    travelers,
    tripDirection,
  };
}
