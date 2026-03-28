// Auth
export { useAuthStatus } from "./auth/useAuthStatus";

// Trips
export { useTrips } from "./trips/useTrips";
export { useTrip } from "./trips/useTrip";
export { useCreateTrip } from "./trips/useCreateTrip";
export { useDiscoverActivities } from "./trips/useDiscoverActivities";
export { useRecordActivitySwipe } from "./trips/useRecordActivitySwipe";
export { useActivityImages } from "./trips/useActivityImages";
export { useDeleteTrip } from "./trips/useDeleteTrip";

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

// Admin
export { useAdminStats } from "./admin/useAdminStats";
export { useAdminUsers } from "./admin/useAdminUsers";
export { useAdminTrips } from "./admin/useAdminTrips";
export { useDeleteAdminTrip } from "./admin/useDeleteAdminTrip";
export type { AdminStats, AdminTrip } from "./admin/shared";

// Booking Clicks
export { useBookingClicks } from "./booking-clicks/useBookingClicks";
export { useManualBooking } from "./booking-clicks/useManualBooking";
