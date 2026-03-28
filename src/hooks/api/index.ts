// Auth
export { useAuthStatus } from "./auth/useAuthStatus";

// Trips
export { useTrips } from "./trips/useTrips";
export { useTrip } from "./trips/useTrip";
export { useCreateTrip } from "./trips/useCreateTrip";
export { useTripGeneration } from "./trips/useTripGeneration";
export { useDiscoverActivities } from "./trips/useDiscoverActivities";
export { useRecordActivitySwipe } from "./trips/useRecordActivitySwipe";
export { useActivityImages } from "./trips/useActivityImages";
export type { TripDetail } from "./trips/shared";

// Enrichment
export { useVisaEnrichment } from "./enrichment/useVisaEnrichment";
export { useWeatherEnrichment } from "./enrichment/useWeatherEnrichment";
export { useAccommodationEnrichment } from "./enrichment/useAccommodationEnrichment";
export { fetchAccommodationEnrichment, getAccommodationQueryKey } from "./enrichment/shared";

// Profile
export { useProfile } from "./profile/useProfile";
export { useTravelerPreferences } from "./profile/useTravelerPreferences";
export { useSaveProfile } from "./profile/useSaveProfile";
export { useExportData } from "./profile/useExportData";
export { useDeleteAccount } from "./profile/useDeleteAccount";
export type { PersistedProfile, ProfileData } from "./profile/shared";

// Admin
export { useAdminStats } from "./admin/useAdminStats";
export { useAdminUsers } from "./admin/useAdminUsers";
export { useAdminTrips } from "./admin/useAdminTrips";
export { useDeleteAdminTrip } from "./admin/useDeleteAdminTrip";
export type { AdminStats, AdminUser, AdminTrip } from "./admin/shared";

// Flights
export { useFlightSearch, useBatchFlightSearch } from "./flights/useFlightSearch";

// Booking Clicks
export { useBookingClicks } from "./booking-clicks/useBookingClicks";
export { useManualBooking } from "./booking-clicks/useManualBooking";

// Selections (shopping cart)
export { useFlightSelections } from "./selections/useFlightSelections";
export { useHotelSelections } from "./selections/useHotelSelections";
export { useUpsertFlightSelection } from "./selections/useUpsertFlightSelection";
export { useUpsertHotelSelection } from "./selections/useUpsertHotelSelection";
export { useRemoveSelection } from "./selections/useRemoveSelection";
export { useMarkSelectionBooked } from "./selections/useMarkSelectionBooked";
export { useCart } from "./selections/useCart";
export { useUnbookedCount } from "./selections/useUnbookedCount";
