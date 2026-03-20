// Auth
export { useAuthStatus } from "./useAuth";

// Trips
export { useTrips, useTrip } from "./useTrips";
export { useCreateTrip } from "./useTripMutations";
export { useTripGeneration } from "./useTripGeneration";
export { useCityActivityGeneration } from "./useCityActivityGeneration";
export {
  usePrefetchRouteSelection,
  useFetchRouteSelection,
  buildCacheKey,
} from "./useRouteSelection";

// Enrichment
export {
  useVisaEnrichment,
  useWeatherEnrichment,
  useAccommodationEnrichment,
  fetchAccommodationEnrichment,
  getAccommodationQueryKey,
} from "./useEnrichment";

// Profile
export { useProfile, useSaveProfile, useExportData, useDeleteAccount } from "./useProfile";

// Admin
export { useAdminStats, useAdminUsers, useAdminTrips, useDeleteAdminTrip } from "./useAdmin";
